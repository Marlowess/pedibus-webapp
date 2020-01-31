package it.polito.pedibus.backend.configurations;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Configuration
public class JavaMailSenderConfig {

    @Value(value = "${spring.mail.host}")
    private String host;

    @Value(value = "${spring.mail.port}")
    private int port;

    @Value(value = "${spring.mail.username}")
    private String username;

    @Value(value = "${spring.mail.password}")
    private String password;

    @Bean
    public SimpleMailMessage templateSimpleMessage() {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setText("This is the test email template for your email:\n%s\n");
        return message;
    }

    @Bean
    public JavaMailSender getJavaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();

        mailSender.setHost(host);
        mailSender.setPort(port);

        mailSender.setUsername(username);
        mailSender.setPassword(password);

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.debug", "true");

        StringBuilder sb = new StringBuilder();
        sb.append(mailSender.getPassword())
                .append(" ").append(mailSender.getHost())
                .append(" ").append(mailSender.getPort())
                .append(" ").append(mailSender.getUsername());

        return mailSender;
    }
}
