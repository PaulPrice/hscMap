1. Build prerequisites for tileMaker
    * [GCC >= 5.1](https://gcc.gnu.org)
        ```sh:install-gcc.sh
        mkdir -p $HOME/tmp
        cd $HOME/tmp
        wget http://ftp.tsukuba.wide.ad.jp/software/gcc/releases/gcc-7.1.0/gcc-7.1.0.tar.gz
        tar xvzf gcc-7.1.0.tar.gz
        cd gcc-7.1.0
        ./contrib/download_prerequisites
        ./configure --prefix=$HOME/hscMap --disable-bootstrap --enable-stage1-languages=c,c++ --disable-multilib
        make -j32
        make install
        ```
    * [SFITSIO >= 1.4.5](http://www.ir.isas.jaxa.jp/~cyamauch/sli/index.html)
        ```sh:instal.sh
        mkdir -p $HOME/tmp
        cd $HOME/tmp
        wget http://www.ir.isas.jaxa.jp/~cyamauch/sli/sllib-1.4.5.tar.gz
        tar xvzf sllib-1.4.5.tar.gz
        cd sllib-1.4.5
        ./configure --prefix=$HOME/hscMap
        make -j32
        make install

        cd $HOME/tmp
        wget http://www.ir.isas.jaxa.jp/~cyamauch/sli/sfitsio-1.4.5.tar.gz
        tar xvzf sfitsio-1.4.5.tar.gz
        cd sfitsio-1.4.5
        ./configure --prefix=$HOME/hscMap
        make -j32
        make install
        ```
    * [numpy](http://numpy.readthedocs.io/en/latest/), [pyfits](http://www.stsci.edu/institute/software_hardware/pyfits)
        ```
        pip install numpy
        pip install pyfits
        ```
1. Build tileMaker
    ```sh:install-tileMaker.sh
    git clone https://github.com/michitaro/hscMap
    cd backend/tileMaker
    make -B GCC_DIR=$HOME/hscMap SFITSIO_DIR=$HOME/hscMap
    ```
1. Make tiles
    ```
    cd backend/tileMaker
    python tileMaker.py --outDir test --inDir /path/to/pipeline/output --filters CLAUDS-U --tracts 10054 10053
    # /path/to/pipeline/output is a directory that includes directory "deepCoadd"
    ```