all: js #build
.PHONY: js serve

js: 
	@-( \
		cd ./src/; \
		tsc ; \
		cd ..; \
	)

serve: 
	@-( \
		python3 -m http.server \
	)