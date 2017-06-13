#include <stdio.h>
#include <stdlib.h>
#include <png.h>
#include <sli/fitscc.h>


namespace mtk {


    template <typename CALLBACK>
    int writePng(const char* filename, int width, int height, const CALLBACK &callback) {
        int return_code = 1;
        FILE *fp;
        png_structp png_ptr;
        png_infop info_ptr;
        png_bytep row;
        fp = fopen(filename, "wb");
        if (fp == NULL) {
            fprintf(stderr, "Could not open file %s for writing\n", filename);
            goto finalise;
        }

        png_ptr = png_create_write_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);
        if (png_ptr == NULL) {
            fprintf(stderr, "Could not allocate write struct\n");
            goto finalise;
        }

        info_ptr = png_create_info_struct(png_ptr);
        if (info_ptr == NULL) {
            fprintf(stderr, "Could not allocate info struct\n");
            goto finalise;
        }

        if (setjmp(png_jmpbuf(png_ptr))) {
            fprintf(stderr, "Error during png creation\n");
            goto finalise;
        }

        png_init_io(png_ptr, fp);

        png_set_IHDR(png_ptr, info_ptr, width, height, 8, PNG_COLOR_TYPE_GRAY, PNG_INTERLACE_NONE, PNG_COMPRESSION_TYPE_DEFAULT, PNG_FILTER_TYPE_DEFAULT);

        png_write_info(png_ptr, info_ptr);

        row = (png_bytep) malloc(width * sizeof(png_byte));

        callback(row, [&](png_bytep r) { png_write_row(png_ptr, r); });
        png_write_end(png_ptr, NULL);

        return_code = 0;
        finalise:
        if (fp != NULL) fclose(fp);
        if (info_ptr != NULL) png_free_data(png_ptr, info_ptr, PNG_FREE_ALL, -1);
        if (png_ptr != NULL) png_destroy_write_struct(&png_ptr, (png_infopp)NULL);
        if (row != NULL) free(row);

        return return_code;
    }



    /*
    int main(int argc, char *argv[]) {
        sli::fitscc r_fits, g_fits, b_fits;
        fprintf(stderr, "loading %s...\n", argv[1]);
        r_fits.read_stream(argv[1]);
        fprintf(stderr, "loading %s...\n", argv[2]);
        g_fits.read_stream(argv[2]);
        fprintf(stderr, "loading %s...\n", argv[3]);
        b_fits.read_stream(argv[3]);

        r_fits.image(0L).convert_type(sli::FITS::FLOAT_T);
        g_fits.image(0L).convert_type(sli::FITS::FLOAT_T);
        b_fits.image(0L).convert_type(sli::FITS::FLOAT_T);

        sli::mdarray_float &r_data = r_fits.image(0L).float_array();
        sli::mdarray_float &g_data = g_fits.image(0L).float_array();
        sli::mdarray_float &b_data = b_fits.image(0L).float_array();

        int width  = r_data.length(0),
            height = r_data.length(1);

        writeImage(argv[4], width, height, [&](png_byte *ptr, int x, int y) {
            ptr[0] = r_data(x, height - y) * 255;
            ptr[1] = g_data(x, height - y) * 255;
            ptr[2] = b_data(x, height - y) * 255;
        });

        return 0;
    }
    */

}
