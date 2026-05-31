package com.agricultural.jobs.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "job_offers")
public class JobOffer {
    
    @Id
    private String id;
    
    private String title;
    
    private String description;
    
    private JobType jobType;
    
    private ContractType contractType;
    
    private String location;
    
    private Double locationLat;

    private Double locationLng;
    
    private String farmerId;
    
    private String farmerName;
    
    private String farmName;
    
    private List<String> requirements = new ArrayList<>();
    
    private List<String> benefits = new ArrayList<>();
    
    private Integer positions; // Number of positions available

    private Double salaryMin;

    private Double salaryMax;
    
    private JobStatus status;
    
    private List<JobApplication> applications = new ArrayList<>();
    
    private LocalDateTime applicationDeadline;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    public enum JobType {
        SEASONAL,
        PERMANENT,
        TEMPORARY,
        HARVEST,
        GENERAL_FARM_WORK,
        SPECIALIZED
    }
    
    public enum ContractType {
        FULL_TIME,
        PART_TIME,
        CONTRACT,
        INTERNSHIP
    }
    
    public enum JobStatus {
        OPEN,
        CLOSED,
        FILLED
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JobApplication {
        private String applicantId;
        private String applicantName;
        private String applicantEmail;
        private String applicantPhone;
        private String coverLetter;
        private String resumeUrl;
        private ApplicationStatus status;
        private LocalDateTime appliedAt;
        private String notes;
        
        public enum ApplicationStatus {
            PENDING,
            REVIEWED,
            SHORTLISTED,
            INTERVIEWED,
            ACCEPTED,
            REJECTED
        }
    }
}
