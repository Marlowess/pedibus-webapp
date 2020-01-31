# Fase di di building con Maven
FROM maven:3.5-jdk-8 AS build  
COPY backend/src /usr/src/app/src 
# COPY pedibus-frontend /usr/src/app/pedibus-frontend 
COPY backend/pom.xml /usr/src/app 
RUN mvn -f /usr/src/app/pom.xml clean package -DskipTests

# Expose port 587 for smtp connections
EXPOSE 587

# Fase di deploying
FROM openjdk:8-alpine

# Setto la timezone corretta ed installo i pacchetti necessari
RUN apk update && apk add bash
RUN apk --update add tzdata && \
    cp /usr/share/zoneinfo/Europe/Rome /etc/localtime && \
    apk del tzdata && \
    rm -rf /var/cache/apk/

ENV TZ=Europe/Rome
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

COPY --from=build /usr/src/app/target/es3-0.0.1-SNAPSHOT.jar /usr/app/es3-0.0.1-SNAPSHOT.jar

ENTRYPOINT ["java","-jar","/usr/app/es3-0.0.1-SNAPSHOT.jar"]
