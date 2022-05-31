
FROM debian:stable

ENV DEBIAN_FRONTEND=noninteractive

RUN apt -y update && apt install -y ca-certificates

ADD https://raw.githubusercontent.com/jehon/packages/main/start /start
RUN chmod +x /start && ./start

RUN apt install -y jehon-system-kiosk

RUN apt install -y xvfb
