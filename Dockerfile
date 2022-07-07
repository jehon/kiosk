
FROM jehon/devcontainer

RUN DEBIAN_FRONTEND=noninteractive apt update && apt install -y jehon-system-kiosk xvfb
