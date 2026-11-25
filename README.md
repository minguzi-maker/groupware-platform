# groupware-platform
IBM 5기 3팀 AI 에이전트 그룹웨어 SaaS 플랫폼
팀명: 갓생코더

여러 고객사(테넌트)가 하나의 애플리케이션과 데이터베이스를 나눠 쓰는 pooled 모델이다.

로컬 설치 순서는 [설치 가이드](docs/설치-가이드.md)를 따릅니다.
서비스를 띄우는 순서는 [첫 실행 가이드](docs/첫-실행-가이드.md)를 따릅니다.

프론트엔드 문서는 [platform-web](frontends/platform-web/README.md)과 [tenant-web](frontends/tenant-web/README.md)에 있습니다.

## 개발 환경

| 구분 | 기술 스택 |
|------|-----------|
| 언어 / 런타임 | Java 21, Node.js 22 |
| 서비스 API | Spring Boot 4, Spring MVC |
| 보안 | Spring Security 7, JWT |
| 설정 전파 | Spring Cloud Bus + RabbitMQ |
| RDBMS | PostgreSQL 17 + pgvector |
| 캐시 | Redis |
| 서비스 간 통신 | RestClient + @HttpExchange (동기), Kafka (비동기, KRaft) |
| Frontend | React + Vite + React Router + Tailwind CSS 4 |
| CI/CD 파이프라인 | ArgoCD |
| 컨테이너화 및 배포 | Docker + Kubernetes |
| 컨테이너 오케스트레이션 | OpenShift |
| 모니터링 및 대시보드 | Prometheus + Grafana, Elasticsearch + Kibana |
| 오브젝트 스토리지 | 로컬 Garage, 배포 AWS S3 |
| Git 저장소 | Github |
| AI | Python FastAPI, Gemini RAG, Tool Calling, LangChain, LangGraph |
| AI 연동 | MCP 프로토콜 |