package com.deducto.service;

import com.deducto.dto.material.MaterialResponse;
import com.deducto.entity.Course;
import com.deducto.entity.Material;
import com.deducto.entity.MaterialType;
import com.deducto.entity.ProcessingStatus;
import com.deducto.repository.MaterialRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class MaterialIngestionService {

    private static final Logger log = LoggerFactory.getLogger(MaterialIngestionService.class);

    private final MaterialRepository materialRepository;
    private final S3StorageService s3StorageService;
    private final MaterialTextExtractor textExtractor;
    private final JdbcTemplate jdbcTemplate;

    public MaterialIngestionService(
            MaterialRepository materialRepository,
            S3StorageService s3StorageService,
            MaterialTextExtractor textExtractor,
            JdbcTemplate jdbcTemplate
    ) {
        this.materialRepository = materialRepository;
        this.s3StorageService = s3StorageService;
        this.textExtractor = textExtractor;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public MaterialResponse createForCourse(Course course, MultipartFile file, String description) throws IOException {
        byte[] data = file.getBytes();
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload.bin";
        MaterialType mtype = materialTypeForFilename(originalName);
        String s3Key = "materials/" + course.getId() + "/"
                + UUID.randomUUID() + "_" + safeFilename(originalName);
        String contentType = contentType(mtype, originalName, file.getContentType());
        s3StorageService.putBytes(s3Key, data, contentType);

        var material = new Material();
        material.setCourse(course);
        material.setType(mtype);
        material.setFilename(originalName);
        material.setS3Key(s3Key);
        material.setProcessingStatus(ProcessingStatus.pending);
        material.setMetadata(new java.util.HashMap<>());
        material = materialRepository.saveAndFlush(material);

        try {
            material.setProcessingStatus(ProcessingStatus.processing);
            material = materialRepository.saveAndFlush(material);
            Map<String, Object> meta = switch (mtype) {
                case video -> textExtractor.buildMetadataForVideo(description);
                case pdf -> textExtractor.buildMetadataForPdf(data, description);
                case ppt -> {
                    if (originalName.toLowerCase(Locale.ROOT).endsWith(".ppt")) {
                        yield textExtractor.buildMetadataForPpt(data, description);
                    }
                    yield textExtractor.buildMetadataForPptx(data, description);
                }
            };
            material.setMetadata(meta);
            material.setProcessingStatus(ProcessingStatus.ready);
        } catch (Exception e) {
            material.setMetadata(failedMetadata(description, e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
            material.setProcessingStatus(ProcessingStatus.failed);
        }
        material = materialRepository.saveAndFlush(material);
        return toResponse(material);
    }

    /**
     * Load the row inside this transaction so the entity is managed — deleting a
     * detached instance from the controller can cause remove() to fail.
     */
    @Transactional
    public void deleteMaterialById(long id) {
        Material managed = materialRepository.findByIdWithCourse(id)
                .orElseThrow(() -> new NoSuchElementException("Material not found: " + id));
        long mid = managed.getId();
        String key = managed.getS3Key();
        try {
            s3StorageService.deleteFile(key);
        } catch (RuntimeException e) {
            log.warn("S3 delete failed for key {}, continuing with DB delete: {}", key, e.getMessage());
        }
        try {
            jdbcTemplate.update("UPDATE lessons SET material_id = NULL WHERE material_id = ?", mid);
        } catch (Exception e) {
            log.debug("lessons table update skipped or failed: {}", e.getMessage());
        }
        materialRepository.delete(managed);
    }

    public List<MaterialResponse> toResponseList(List<Material> list) {
        return list.stream().map(this::toResponse).toList();
    }

    public MaterialResponse toResponse(Material m) {
        return new MaterialResponse(
                m.getId(),
                m.getCourse().getId(),
                m.getType().name(),
                m.getFilename(),
                m.getProcessingStatus().name(),
                m.getMetadata() != null ? m.getMetadata() : Map.of(),
                m.getCreatedAt()
        );
    }

    private static Map<String, Object> failedMetadata(String description, String err) {
        var m = new java.util.HashMap<String, Object>();
        if (StringUtils.hasText(description)) {
            m.put("description", description.trim());
        }
        m.put("error", err != null ? err : "extraction failed");
        m.put("full_text", "");
        return m;
    }

    private static MaterialType materialTypeForFilename(String name) {
        String ext = extension(name);
        if ("pdf".equals(ext)) {
            return MaterialType.pdf;
        }
        if ("ppt".equals(ext) || "pptx".equals(ext)) {
            return MaterialType.ppt;
        }
        if ("mp4".equals(ext) || "webm".equals(ext) || "mov".equals(ext) || "mkv".equals(ext) || "mpeg".equals(ext)
                || "m4v".equals(ext)) {
            return MaterialType.video;
        }
        throw new IllegalArgumentException("Unsupported file type: " + (ext.isEmpty() ? name : ext));
    }

    public static String extension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }

    private static String safeFilename(String name) {
        int slash = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
        String base = slash >= 0 ? name.substring(slash + 1) : name;
        return base.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private static String contentType(MaterialType mtype, String originalName, String fromFile) {
        if (StringUtils.hasText(fromFile)) {
            return fromFile;
        }
        if (mtype == MaterialType.ppt) {
            if (originalName != null && originalName.toLowerCase(Locale.ROOT).endsWith(".ppt")) {
                return "application/vnd.ms-powerpoint";
            }
            return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        }
        if (mtype == MaterialType.pdf) {
            return "application/pdf";
        }
        return "video/mp4";
    }
}
