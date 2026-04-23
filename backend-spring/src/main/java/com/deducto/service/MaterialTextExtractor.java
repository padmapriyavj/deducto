package com.deducto.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.hslf.usermodel.HSLFShape;
import org.apache.poi.hslf.usermodel.HSLFSlide;
import org.apache.poi.hslf.usermodel.HSLFSlideShow;
import org.apache.poi.hslf.usermodel.HSLFTextShape;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xslf.usermodel.XSLFShape;
import org.apache.poi.xslf.usermodel.XSLFSlide;
import org.apache.poi.xslf.usermodel.XSLFTextShape;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class MaterialTextExtractor {

    public Map<String, Object> buildMetadataForPdf(byte[] data, String description) {
        var meta = baseMeta(description);
        var extracted = extractPdf(data);
        meta.put("full_text", extracted.text());
        meta.put("pages", extracted.pageCount());
        return meta;
    }

    public Map<String, Object> buildMetadataForPptx(byte[] data, String description) {
        var meta = baseMeta(description);
        var extracted = extractPptx(data);
        meta.put("full_text", extracted.text());
        meta.put("slides", extracted.slideCount());
        return meta;
    }

    public Map<String, Object> buildMetadataForPpt(byte[] data, String description) {
        var meta = baseMeta(description);
        var extracted = extractPpt(data);
        meta.put("full_text", extracted.text());
        meta.put("slides", extracted.slideCount());
        return meta;
    }

    public Map<String, Object> buildMetadataForVideo(String description) {
        var meta = baseMeta(description);
        meta.put("full_text", "");
        return meta;
    }

    private static Map<String, Object> baseMeta(String description) {
        var meta = new HashMap<String, Object>();
        if (description != null && !description.isBlank()) {
            meta.put("description", description.trim());
        }
        return meta;
    }

    private ExtractionResult extractPdf(byte[] data) {
        try (PDDocument document = Loader.loadPDF(data)) {
            var stripper = new PDFTextStripper();
            String text = stripper.getText(document);
            return new ExtractionResult(text != null ? text : "", document.getNumberOfPages());
        } catch (IOException e) {
            throw new ExtractionException("Failed to read PDF: " + e.getMessage(), e);
        }
    }

    private ExtractionResult extractPptx(byte[] data) {
        try (var in = new ByteArrayInputStream(data);
                XMLSlideShow show = new XMLSlideShow(in)) {
            int slideCount = show.getSlides().size();
            List<String> parts = new ArrayList<>();
            for (XSLFSlide slide : show.getSlides()) {
                for (XSLFShape shape : slide.getShapes()) {
                    if (shape instanceof XSLFTextShape t) {
                        String s = t.getText();
                        if (s != null && !s.isBlank()) {
                            parts.add(s.strip());
                        }
                    }
                }
            }
            return new ExtractionResult(String.join("\n", parts), slideCount);
        } catch (IOException e) {
            throw new ExtractionException("Failed to read PPTX: " + e.getMessage(), e);
        }
    }

    private ExtractionResult extractPpt(byte[] data) {
        try (var in = new ByteArrayInputStream(data);
                HSLFSlideShow show = new HSLFSlideShow(in)) {
            int slideCount = show.getSlides().size();
            List<String> parts = new ArrayList<>();
            for (HSLFSlide slide : show.getSlides()) {
                for (HSLFShape shape : slide.getShapes()) {
                    if (shape instanceof HSLFTextShape t) {
                        String s = t.getText();
                        if (s != null && !s.isBlank()) {
                            parts.add(s.strip());
                        }
                    }
                }
            }
            return new ExtractionResult(String.join("\n", parts), slideCount);
        } catch (IOException e) {
            throw new ExtractionException("Failed to read PPT: " + e.getMessage(), e);
        }
    }

    public static final class ExtractionException extends RuntimeException {
        public ExtractionException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    private record ExtractionResult(String text, int slideOrPageCount) {
        int pageCount() {
            return slideOrPageCount;
        }

        int slideCount() {
            return slideOrPageCount;
        }
    }
}
