package com.deducto.controller;

import com.deducto.dto.api.ApiErrorResponse;
import com.deducto.dto.concept.ConceptGenerateResponse;
import com.deducto.dto.concept.ConceptItemResponse;
import com.deducto.dto.concept.ConceptListResponse;
import com.deducto.entity.Concept;
import com.deducto.entity.Course;
import com.deducto.entity.Lesson;
import com.deducto.entity.UserRole;
import com.deducto.repository.ConceptRepository;
import com.deducto.repository.EnrollmentRepository;
import com.deducto.repository.LessonRepository;
import com.deducto.security.UserPrincipal;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.net.HttpRetryException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;

@RestController
public class ConceptController {

    private static final int MAX_TEXT_CHARS = 95_000;

    private static final String CONCEPTS_SYSTEM = """
            You are an expert curriculum analyst. Given course context and instructional text, \
            extract 4-8 distinct important concepts students must learn (use fewer if the text is very short). \
            Respond with JSON only. Use either: \
            (1) a JSON array of objects, each with "name" and "description" string fields, or \
            (2) a single JSON object with a "concepts" key whose value is that array. \
            Do not wrap the JSON in markdown code fences. No text before or after the JSON. \
            Names are concise (max 200 characters); descriptions are 1-3 sentences, classroom-appropriate.""";

    private final LessonRepository lessonRepository;
    private final ConceptRepository conceptRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ObjectMapper objectMapper;
    private final ChatClient chatClient;
    private final String openAiApiKey;

    public ConceptController(
            LessonRepository lessonRepository,
            ConceptRepository conceptRepository,
            EnrollmentRepository enrollmentRepository,
            ObjectMapper objectMapper,
            ChatClient chatClient,
            @Value("${spring.ai.openai.api-key:}") String openAiApiKey
    ) {
        this.lessonRepository = lessonRepository;
        this.conceptRepository = conceptRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.objectMapper = objectMapper;
        this.chatClient = chatClient;
        this.openAiApiKey = openAiApiKey;
    }

    @PostMapping("/api/v1/lessons/{lessonId}/concepts/generate")
    @Transactional
    public ResponseEntity<?> generate(
            @PathVariable("lessonId") long lessonId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        requireAuth(principal);
        if (principal.role() != UserRole.professor) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiErrorResponse.forbiddenWithMessage("Professor access required"));
        }
        if (!StringUtils.hasText(openAiApiKey)) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(ApiErrorResponse.serviceUnavailable(
                            "LLM API key is not configured (set OPENAI_API_KEY, or GROQ_API_KEY with OPENAI_BASE_URL)"));
        }
        var lesson = lessonRepository.findByIdWithCourseAndMaterial(lessonId)
                .orElseThrow(() -> new NoSuchElementException("Lesson not found: " + lessonId));
        if (!Objects.equals(lesson.getCourse().getProfessor().getId(), principal.id())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiErrorResponse.forbiddenWithMessage("Only the course owner can generate concepts"));
        }
        if (lesson.getMaterial() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiErrorResponse.badRequest("Lesson has no material; attach a material before generating concepts"));
        }
        String fullText = extractFullText(lesson);
        if (!StringUtils.hasText(fullText)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiErrorResponse.badRequest(
                            "No text on this material (metadata.full_text is empty). Upload and process a material first."));
        }
        if (fullText.length() > MAX_TEXT_CHARS) {
            fullText = fullText.substring(0, MAX_TEXT_CHARS);
        }

        String courseName = lesson.getCourse().getName() != null ? lesson.getCourse().getName() : "";
        String lessonTitle = lesson.getTitle() != null ? lesson.getTitle() : "";
        String userPrompt = "Course: " + courseName + "\nLesson title: " + lessonTitle + "\n\nMaterial text:\n" + fullText;

        String raw;
        try {
            raw = chatClient.prompt()
                    .system(CONCEPTS_SYSTEM)
                    .user(userPrompt)
                    .call()
                    .content();
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "LLM call failed: " + describeLlmException(e));
        }
        if (raw == null || raw.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "LLM returned an empty response");
        }

        List<ConceptNameDescription> parsed;
        try {
            parsed = parseConceptsFromLlmResponse(raw);
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to parse LLM JSON: " + e.getMessage());
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, e.getMessage());
        }
        if (parsed.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Model returned no concepts");
        }

        conceptRepository.deleteByLesson_Id(lessonId);
        conceptRepository.flush();

        List<ConceptItemResponse> saved = new ArrayList<>();
        for (ConceptNameDescription row : parsed) {
            var c = new Concept();
            c.setLesson(lesson);
            c.setName(row.name());
            c.setDescription(row.description());
            c = conceptRepository.save(c);
            saved.add(toItem(c, lessonId));
        }
        return ResponseEntity.ok(new ConceptGenerateResponse(lessonId, saved, true));
    }

    @GetMapping("/api/v1/lessons/{lessonId}/concepts")
    public ConceptListResponse list(
            @PathVariable("lessonId") long lessonId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        requireAuth(principal);
        var lesson = lessonRepository.findByIdWithCourseAndMaterial(lessonId)
                .orElseThrow(() -> new NoSuchElementException("Lesson not found: " + lessonId));
        if (!canViewCourse(principal, lesson.getCourse())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        List<ConceptItemResponse> items = conceptRepository.findByLesson_IdOrderByIdAsc(lessonId).stream()
                .map(c -> toItem(c, lessonId))
                .toList();
        return new ConceptListResponse(lessonId, items);
    }

    private static void requireAuth(UserPrincipal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
    }

    private boolean canViewCourse(UserPrincipal principal, Course course) {
        if (Objects.equals(course.getProfessor().getId(), principal.id())) {
            return true;
        }
        return enrollmentRepository.existsByUser_IdAndCourse_Id(principal.id(), course.getId());
    }

    private String extractFullText(Lesson lesson) {
        var m = lesson.getMaterial();
        if (m == null) {
            return "";
        }
        Map<String, Object> meta = m.getMetadata();
        if (meta == null) {
            return "";
        }
        Object ft = meta.get("full_text");
        return ft == null ? "" : String.valueOf(ft);
    }

    private static ConceptItemResponse toItem(Concept c, long lessonId) {
        return new ConceptItemResponse(
                c.getId(),
                lessonId,
                c.getName(),
                c.getDescription() != null ? c.getDescription() : ""
        );
    }

    /**
     * Include HTTP body when Spring's RestClient failed to decode (e.g. text/plain from a proxy
     * or a non-JSON OpenAI error), so local debugging does not require log diving.
     */
    private static String describeLlmException(Exception e) {
        if (isLikelyOpenAiAuthFailure(e)) {
            return openAiAuthFailedHint();
        }
        String base = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
        Throwable t = e;
        for (int i = 0; i < 10 && t != null; i++) {
            if (t instanceof RestClientResponseException r) {
                String body = r.getResponseBodyAsString(StandardCharsets.UTF_8);
                if (StringUtils.hasText(body)) {
                    String trimmed = body.length() > 1200 ? body.substring(0, 1200) + "…" : body;
                    return base + " | http " + r.getStatusCode().value() + ": " + trimmed;
                }
                return base + " | http " + r.getStatusCode().value();
            }
            t = t.getCause();
        }
        if (looksLikeOpenAiDecodeFailureFrom401(base)) {
            return base + " " + openAiAuthFailedHint();
        }
        return base;
    }

    private static String openAiAuthFailedHint() {
        return "The LLM returned 401 (authentication failed) or the response was not valid JSON. "
                + "OpenAI: new key at https://platform.openai.com/api-keys , set OPENAI_API_KEY, verify: "
                + "curl -sS -o /dev/null -w \"%{http_code}\\n\" https://api.openai.com/v1/models "
                + "-H \"Authorization: Bearer $OPENAI_API_KEY\" (expect 200). "
                + "Groq: set GROQ_API_KEY (or OPENAI_API_KEY), OPENAI_BASE_URL=https://api.groq.com/openai, "
                + "LLM_MODEL to a Groq model (see https://console.groq.com/keys), restart.";
    }

    /**
     * JDK {@link HttpRetryException} is often the cause when OpenAI returns 401: the body cannot be
     * read again, then RestClient reports "text/plain" instead of JSON.
     */
    private static boolean isLikelyOpenAiAuthFailure(Throwable e) {
        for (int i = 0; i < 16 && e != null; i++) {
            if (e instanceof HttpRetryException) {
                return true;
            }
            String m = e.getMessage();
            if (m != null) {
                String lower = m.toLowerCase();
                if (lower.contains("server authentication") || lower.contains("due to server authentication")) {
                    return true;
                }
            }
            e = e.getCause();
        }
        return false;
    }

    private static boolean looksLikeOpenAiDecodeFailureFrom401(String topMessage) {
        if (topMessage == null) {
            return false;
        }
        return topMessage.contains("text/plain")
                && topMessage.contains("ChatCompletion");
    }

    static String stripMarkdownCodeFences(String raw) {
        if (raw == null) {
            return "";
        }
        String s = raw.trim();
        if (!s.startsWith("```")) {
            return s;
        }
        int firstNl = s.indexOf('\n');
        if (firstNl < 0) {
            return s;
        }
        s = s.substring(firstNl + 1);
        int lastFence = s.lastIndexOf("```");
        if (lastFence >= 0) {
            s = s.substring(0, lastFence);
        }
        return s.trim();
    }

    private List<ConceptNameDescription> parseConceptsFromLlmResponse(String raw) throws JsonProcessingException {
        String cleaned = stripMarkdownCodeFences(raw);
        JsonNode root = objectMapper.readTree(cleaned);
        JsonNode array;
        if (root.isArray()) {
            array = root;
        } else if (root.isObject() && root.has("concepts") && root.get("concepts").isArray()) {
            array = root.get("concepts");
        } else {
            throw new IllegalStateException("LLM output must be a JSON array or an object with a \"concepts\" array");
        }
        List<ConceptNameDescription> out = new ArrayList<>();
        for (JsonNode n : array) {
            if (n == null || !n.isObject()) {
                continue;
            }
            JsonNode nameNode = n.get("name");
            if (nameNode == null || !nameNode.isTextual()) {
                continue;
            }
            String name = nameNode.asText().trim();
            if (name.length() > 200) {
                name = name.substring(0, 200);
            }
            if (name.isEmpty()) {
                continue;
            }
            String desc = "";
            JsonNode d = n.get("description");
            if (d != null && d.isTextual()) {
                desc = d.asText().trim();
            }
            out.add(new ConceptNameDescription(name, desc));
        }
        return out;
    }

    private record ConceptNameDescription(String name, String description) {
    }
}
