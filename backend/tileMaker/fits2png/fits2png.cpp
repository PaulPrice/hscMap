#include <sli/fitscc.h>
#include <getopt.h>
#include <vector>
#include <string>
#include <stdexcept>
#include <algorithm>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <stdarg.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <errno.h>
#include "writePng.h"


using std::string;
using std::vector;


#define LOG(fmt, ...) fprintf(stderr, "%s | " fmt "\n", timestamp().c_str(), ## __VA_ARGS__)
static string timestamp();


struct Args {
    long           imageLayer = 1;
    string         outDir;
    vector<string> files;
};


static void parseArgs(Args &args, int argc, char *argv[]);
static void loadImages(vector<sli::mdarray_float> &images, const vector<string> &files, long imageLayer);
static void halfSize(vector<sli::mdarray_float> &images);
static void makeTile(vector<sli::mdarray_float> &images, const string &outDir, int size = 256);
static void applyFilter(vector<sli::mdarray_float> &images);
static void makeDirs(const string &dir);
template <typename... Args> string format(const char *fmt, Args... args) {
    int n = snprintf(NULL, 0, fmt, args...);
    char buf[n + 1];
    snprintf(buf, n + 1, fmt, args...);
    return buf;
}


int main(int argc, char *argv[]) try {
    Args args;
    parseArgs(args, argc, argv);

    vector<sli::mdarray_float> images(args.files.size());
    loadImages(images, args.files, args.imageLayer);
    applyFilter(images);

    // for (int z = 16;  z >= 0;  z--) {
    for (int z = 0;  z <= 8;  ++z) {
        makeTile(images, args.outDir + format("/%d", z));
        halfSize(images);
    }

    return 0;
}
catch (const std::exception &e) {
    fprintf(stderr, "error: %s\n", e.what());
    exit(1);
}


static inline double imageFilter(double x) {
    double vMax = 1.,
           a    = 10000.;
    if (isnan(x))
       x = 0.;
    x *= 1. / vMax;
    x = asinh(a * x) / asinh(a);
    double minx = -0.1;
    x = (x-minx) / (1-minx);
    if      (x > 1.) x = 1.;
    else if (x < 0.) x = 0.;
    return x;
}


static int n_bits(int n) {
    // 0 -> 1
    // 1 -> 2
    // 2 -> 4
    // 3 -> 4
    // 4 -> 8
    // 5 -> 8
    int i = 1;
    while (n) {
        n >>= 1;
        i <<= 1;
    }
    return i;
}


static void makeTile(vector<sli::mdarray_float> &images, const string &outDir, int size) {
    const auto &base = images[0];
    int nx = base.length(0) / size + 1,
        ny = base.length(1) / size + 1;
    LOG("making tiles... (%d x %d)", nx, ny);

    #pragma omp parallel for
    for (int yi = 0;  yi < ny;  ++yi) {
        int y = yi * size;
        makeDirs(outDir + format("/%d", yi));
        for (int xi = 0;  xi < nx;  ++xi) {
            string outFile = outDir + format("/%d/%d.png", yi, xi);
            int    x = size * xi,
                   width  = size,
                   // height = n_bits(2 * images.size() - 1) * size;
                   height = n_bits(images.size() - 1) * size;
            mtk::writePng(outFile.c_str(), width, height, [&](auto row, auto write) {
                for (int i = 0;  i < images.size();  ++i) {
                    // 0-7th bit
                    for (int yy = 0;  yy < size;  ++yy) {
                        for (int xx = 0;  xx < size;  ++xx) {
                            float v = images[i](x + xx, y + yy);
                            row[xx] = (int)(v * 0xffff) / 0x100;
                        }
                        write(row);
                    }
                    // 8-15th bit
                    /*
                    for (int yy = 0;  yy < size;  ++yy) {
                        for (int xx = 0;  xx < size;  ++xx) {
                            float v = images[i](x + xx, y + yy);
                            row[xx] = (int)(v * 0xffff) & 0xff;
                        }
                        write(row);
                    }
                    */
                }
                std::fill(row, row + size, 0);
                for (int yy = images.size() * size;  yy < height;  ++yy) {
                    write(row);
                }
            });
        }
    }
}


static void applyFilter(vector<sli::mdarray_float> &images) {
    for (int i = 0;  i < images.size();  ++i) {
        auto &image = images[i];
        LOG("applying filer %d/%d...", i, images.size());
        #pragma omp parallel for
        for (int i = 0;  i < image.length();  ++i) {
            image(i) = imageFilter(image(i));
        }
    }
}


static void loadImages(vector<sli::mdarray_float> &images, const vector<string> &files, long imageLayer) {
    LOG("loading %d images...", files.size());
    #pragma omp parallel for
    for (int i = 0;  i < images.size();  ++i) {
        sli::fitscc fits;
        fits.read_stream(files[i].c_str());
        auto &hdu = fits.image(imageLayer);
        hdu.convert_type(sli::FITS::FLOAT_T);
        hdu.float_array().swap(images[i]);
        images[i].flip_rows();
    }
    for (int i = 1;  i < images.size();  ++i) {
        if (images[0].length(0) != images[i].length(0) || images[0].length(1) != images[i].length(1))
            throw std::runtime_error(format("dimensions dont match: %s and %s", files[0].c_str(), files[i].c_str()));
    }
}


static void halfSize(vector<sli::mdarray_float> &images) {
    for (int i = 0;  i < images.size();  ++i) {
        LOG("resizing %d/%d...", i, images.size());
        auto &image = images[i];
        sli::mdarray_float half(false, image.length(0) / 2, image.length(1) / 2);

        #pragma omp parallel for
        for (int y = 0;  y < image.length(1);  ++y) {
            for (int x = 0;  x < image.length(0);  ++x) {
                half(x / 2, y / 2) += image(x, y);
            }
        }
        half *= 1./4.;

        image.swap(half);
    }
}


static void parseArgs(Args &args, int argc, char *argv[]) {
    const char *parse_error = "usage: tileMaker -o OUTDIR FITS-1.fits FITS-2.fits ...";
    int opt;
    while ((opt = getopt(argc, argv, "o:i:")) != -1) {
        switch (opt) {
            case 'o':
                args.outDir = optarg;
                break;
            case 'i':
                args.imageLayer = atoi(optarg);
                break;
            case '?':
                throw std::runtime_error(parse_error);
        }
    }
    for (int i = optind;  i < argc;  ++i) {
        args.files.push_back(argv[i]);
    }
    if (args.outDir == "" || args.files.size() == 0) {
        throw std::runtime_error(parse_error);
    }
}


static void makeDirs(const string &dir) {
    // equivalent to system(format("mkdir -p %s", dir.c_str()).c_str());
    std::vector<char> buf(dir.begin(), dir.end());
    buf.push_back(0);
    for (char *c =  strchr(buf.data(), '/');  c;  c = strchr(c + 1, '/')) {
        *c = 0;
        mkdir(buf.data(), 0777);
        *c = '/';
    }
    if (mkdir(buf.data(), 0777) != 0) {
        struct stat st;
        if (stat(buf.data(), &st) != 0) {
            throw std::runtime_error(format("failed to mkdir: %s, stat: %d", dir.c_str(), errno));
        }
        if (! (S_ISDIR(st.st_mode) && S_IWUSR & st.st_mode)) {
            throw std::runtime_error(format("failed to mkdir: %s, st_mode: %d", dir.c_str(), st.st_mode));
        }
    }
}


static string timestamp() {
    char buf[200];
    time_t t;
    struct tm lt;
    t = time(NULL);
    localtime_r(&t, &lt);
    strftime(buf, sizeof(buf), "%F %T", &lt);
    return buf;
}
