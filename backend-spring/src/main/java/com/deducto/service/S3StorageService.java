package com.deducto.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.Locale;

@Service
public class S3StorageService {

    private final S3Client s3Client;
    private final String bucket;

    public S3StorageService(
            S3Client s3Client,
            @Value("${aws.s3.bucket:}") String bucket
    ) {
        this.s3Client = s3Client;
        this.bucket = bucket;
    }

    public void uploadFile(String key, MultipartFile file) throws IOException {
        if (!StringUtils.hasText(bucket)) {
            throw new IllegalStateException("S3 bucket is not configured (S3_BUCKET)");
        }
        String contentType = file.getContentType();
        if (!StringUtils.hasText(contentType)) {
            String name = file.getOriginalFilename();
            String ext = extension(name);
            contentType = switch (ext) {
                case "pdf" -> "application/pdf";
                case "ppt" -> "application/vnd.ms-powerpoint";
                case "pptx" -> "application/vnd.openxmlformats-officedocument.presentationml.presentation";
                case "mp4" -> "video/mp4";
                case "webm" -> "video/webm";
                case "mov" -> "video/quicktime";
                default -> MediaType.APPLICATION_OCTET_STREAM_VALUE;
            };
        }
        long size = file.getSize();
        if (size < 0) {
            size = file.getBytes().length;
        }
        PutObjectRequest put = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType)
                .contentLength(size)
                .build();
        s3Client.putObject(put, RequestBody.fromInputStream(file.getInputStream(), size));
    }

    public void putBytes(String key, byte[] data, String contentType) {
        if (!StringUtils.hasText(bucket)) {
            throw new IllegalStateException("S3 bucket is not configured (S3_BUCKET)");
        }
        PutObjectRequest put = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType)
                .contentLength((long) data.length)
                .build();
        s3Client.putObject(put, RequestBody.fromBytes(data));
    }

    public void deleteFile(String key) {
        if (!StringUtils.hasText(bucket) || !StringUtils.hasText(key)) {
            return;
        }
        s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build());
    }

    private static String extension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }
}
