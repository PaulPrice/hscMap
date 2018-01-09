cd "`dirname $0`"

rsync -av specDemo mineo-compute:/opt/images/koike-test/python-lib
rsync -av hscMap.py mineo-compute:/opt/images/koike-test/python-lib
rsync -av Dockerfile mineo-compute:/opt/images/koike-test
scp sample.ipynb sample_tanaka.ipynb virgo-small.fits mineo-compute:/opt/images/koike-test/home
ssh mineo-compute 'docker build -t koike /opt/images/koike-test ; echo done'