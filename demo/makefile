all: js #build
.PHONY: python upload clean

js: 
	@-( \
		cd ./src/; \
		tsc ; \
		cd ..; \
	)

#environments
python: clean
	@-( \
		python3 setup.py build_ext --inplace; \
		find . -type f -name '*.pyx' -exec cython -a {} +;\
	)

upload: 
	@-( \
		rm dist/numflow*; \
		python3 setup.py sdist; \
		twine upload dist/*; \
	)

clean:
	@-( \
		find . -type d -wholename '*/build' -exec rm -r {} +;\
    	find . -type f -name '*.so' -exec rm {} +;\
    	find ./numflow/cnumflow/ -type f -name '*.html' -exec rm {} +;\
    	find . -type f -name '*.c' -exec rm {} +;\
    	find . -type f -name '*.cpp' -not -path "*cnumflow/cpp*" -exec rm {} +;\
	)

start: js
	@-( \
		npm start; \
	)