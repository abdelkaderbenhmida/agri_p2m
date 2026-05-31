FROM maven:3.9.5-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests -Dcheckstyle.skip=true -Dpmd.skip=true -Dspotbugs.skip=true -Ddependency-check.skip=true

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
# create a non-root user and set ownership for runtime files
RUN addgroup -S app && adduser -S -G app -u 1000 appuser \
	&& chown -R appuser:app /app

USER 1000

ENTRYPOINT ["java", "-jar", "app.jar"]
