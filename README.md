# MetaCity 

See https://vojtatom.github.io/metacity

## Users
See [Releases](https://github.com/vojtatom/metacity/releases), we use Github Actions to automate the creation of releases for Windows and Linux, so you can download a single archive, unpack it and run the application. 
## Developers
If want change the source code and run the application (assuming you've already downloaded the contents of this repo), **in the repo root** do the following:

1. Install Node.js stuff: `npm install`
2. Get standalone Python (over 200 MB):
    - for Linux: http://urbann.vojtatom.cz/deps/linux-python-386.tar.gz
    - for Windows: http://urbann.vojtatom.cz/deps/windows-python-386.tar.gz 
3. Put the downloaded Python archive into `python/` directory in the root of the repo (if neccesary, create the python directory first).
4. Unpack Python into the right place (which is `src/python/`): 
    - for Linux: `tar -xvzf python/linux-python-386.tar.gz -C src/`
    - for Windows: `tar -xvzf python/windows-python-386.tar.gz src/`
5. Install Python requirements:
    - for Linux: `src/python/install/install/bin/python3.8 -m pip install -r requirements.txt`
    - for Windows: `src/python/install/python.exe -m pip install -r requirements.txt`
6. Run the application `npm start`


