package com.institutoluzdelo.api.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import java.io.IOException;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class CloudinaryService {

    // Agora o Spring injeta a instância configurada automaticamente
    @Autowired
    private Cloudinary cloudinary;

    public String uploadArquivo(MultipartFile file) throws IOException {
        // O método continua limpo, focado apenas no upload
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
        return (String) uploadResult.get("secure_url");
    }
}

