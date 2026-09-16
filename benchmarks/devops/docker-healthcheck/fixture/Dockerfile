FROM nginx:alpine

# BUG: alpine does not have curl installed by default, so curl healthcheck always fails!
HEALTHCHECK --interval=5s --timeout=3s --retries=3 CMD curl -f http://localhost/health || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
