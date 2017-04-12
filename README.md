# hscMap

## Requisites
- Account for HSC SSP Data Release Site.
    - Both [Public Release](https://hsc-release.mtk.nao.ac.jp/doc/) and [Internal Release](http://hsc.mtk.nao.ac.jp/ssp/) are OK
    - You can make an account for Public Release [here](https://hsc-release.mtk.nao.ac.jp/datasearch/new_user/new).

- Platform
    - Mac, Windows (tested)
    - Linux (not tested)
## Install
1. Install [Node.js](https://nodejs.org/). (needed for build)
1. Clone this repository
    ```bash
    git clone https://github.com/michitaro/hscMap
    cd hsc-map
    npm install
    ```

## Run
1. Run dev-server
    - For Internal Release users
        ```bash
        npm run dev-server
        ```
    - For Public Release users
        ```bash
        npm run dev-server-public-release
        ```
1. Open [http://localhost:8080]()
    - If you are requested a password, enter your credentials for the release site.

## Data Source

<!--<img src="https://hsc-release.mtk.nao.ac.jp/doc/wp-content/uploads/2017/04/hscMap-screenshot.png" />-->

- Images in Green Frames
    - [The Hyper Suprime-Cam Subaru Strategic Program](http://hsc.mtk.nao.ac.jp)
<!--- Background Milky Way
    - [ESO/S. Brunier](https://www.eso.org/public/images/eso0932a/)-->
- Star dots
    - [Hipparcos Main Catalog](https://heasarc.gsfc.nasa.gov/W3Browse/all/hipparcos.html)