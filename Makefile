# Informations for Docker setup
BACKEND_CONTAINER_NAME = pedibus_backend_container
BACKEND_CONTAINER_VERSION = 1.0.0
FRONTEND_CONTAINER_NAME = pedibus_frontend_container
BACKEND_CONTAINER_VERSION = 1.0.0
DB_CONTAINER_NAME = pedibus_database_mongo

# Informations on project's authors
AUTHOR_1_NAME = STEFANO BRILLI
AUTHOR_1_EMAIL = s249914@studenti.polito.it
AUTHOR_2_NAME = FRANCESCO MARIA CHIARLO
AUTHOR_2_EMAIL = s253666@studenti.polito.it
AUTHOR_3_NAME = CATERINA OPPICI
AUTHOR_3_EMAIL = s251401@studenti.polito.it
AUTHOR_4_NAME = FABRIZIO RONZINO
AUTHOR_4_EMAIL = s245995@studenti.polito.it

# Informations about the project
PROJECT_NAME = Pedibus
PROJECT_ACADEMIC_YEAR = 2018/2019
PROJECT_COURSE = Applicazioni Internet
PROJECT_UNIVERSITY = Politecnico di Torino


run_credits_display:
	@echo ''
	@echo '*** Welcome to Pedibus Service installer ***'
	@echo 'Pedibus, A.Y. $(PROJECT_ACADEMIC_YEAR), $(PROJECT_COURSE), $(PROJECT_UNIVERSITY)'
	@echo ''
	@echo 'Developed by:'
	@echo '$(AUTHOR_1_NAME) $(AUTHOR_1_EMAIL)'
	@echo '$(AUTHOR_2_NAME) $(AUTHOR_2_EMAIL)'
	@echo '$(AUTHOR_3_NAME) $(AUTHOR_3_EMAIL)'
	@echo '$(AUTHOR_4_NAME) $(AUTHOR_4_EMAIL)'
	@echo ''
	@echo ''

run_deletion_old_containers: run_credits_display	
	@bash docker_util.sh

run_docker_composition: run_deletion_old_containers
	@echo '> Docker building is starting, bye.'	
	@sudo docker-compose up
