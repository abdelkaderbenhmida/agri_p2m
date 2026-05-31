package com.agricultural.jobs;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ScheduledTasks {
    private static final Logger logger = LoggerFactory.getLogger(ScheduledTasks.class);

    // default every 60s; configurable via jobs.heartbeat.rate in application.yml
    @Scheduled(fixedRateString = "${jobs.heartbeat.rate:60000}")
    public void heartbeat() {
        logger.info("jobs-service heartbeat: scheduled task running");
    }
}
