package com.agricultural.auth.service;

import org.springframework.stereotype.Service;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Service
public class SmsService {

    public void sendSmsCode(String toPhone, String code) {
        // Formater le numero (ajouter +216 si numero tunisien sans indicatif)
        String formattedPhone = toPhone;
        if (!toPhone.startsWith("+")) {
            formattedPhone = "+216" + toPhone;
        }

        try {
            RestTemplate restTemplate = new RestTemplate();

            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("phone", formattedPhone);
            params.add("message", "AgriConnect - Votre code de verification est : " + code + ". Ce code expire dans 15 minutes.");
            params.add("key", "textbelt");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
            String response = restTemplate.postForObject("https://textbelt.com/text", request, String.class);
            System.out.println("SMS envoye via TextBelt: " + response);
        } catch (Exception e) {
            System.out.println("SMS echoue (mode dev): code = " + code + " -> " + formattedPhone);
        }
    }
}