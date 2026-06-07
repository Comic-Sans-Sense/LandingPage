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

    @Autowired
    private Cloudinary cloudinary;

    public String uploadArquivo(MultipartFile file) throws IOException {
        try {
            // Log para verificar se o serviço foi acionado
            System.out.println("DEBUG CLOUDINARY: Iniciando upload do arquivo: " + file.getOriginalFilename());
            System.out.println("DEBUG CLOUDINARY: Tamanho do arquivo: " + file.getSize() + " bytes");

            // Executa o upload
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());

            String url = (String) uploadResult.get("secure_url");

            System.out.println("DEBUG CLOUDINARY: Upload realizado com sucesso! URL: " + url);
            return url;
        } catch (Exception e) {
            System.err.println("DEBUG CLOUDINARY: ERRO CRÍTICO NO UPLOAD!");
            e.printStackTrace(); // Isso vai mostrar o erro exato no terminal do Termux
            throw new IOException("Falha no upload para Cloudinary", e);
        }
    }
}
