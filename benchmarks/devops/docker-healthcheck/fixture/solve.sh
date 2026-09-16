#!/usr/bin/env bash
cat << 'EOF' > Dockerfile
FROM nginx:alpine

# Fixed: uses native alpine wget for spider health check
HEALTHCHECK --interval=5s --timeout=3s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF
