FROM idies

EXPOSE 8888

RUN yum -y install wget git bzip2 which
RUN yum -y install libXext-devel libSM-devel libXrender-devel xorg-x11-server-Xvfb

USER idies

RUN cd /home/idies && wget https://repo.continuum.io/archive/Anaconda2-4.4.0-Linux-x86_64.sh
RUN cd /home/idies && bash Anaconda2-4.4.0-Linux-x86_64.sh -b
RUN rm /home/idies/Anaconda2-4.4.0-Linux-x86_64.sh

ENV PATH /home/idies/anaconda2/bin:$PATH
ENV DISPLAY=:1

RUN conda install -y psycopg2

RUN ipython profile create
RUN printf "\nc.InteractiveShellApp.matplotlib = 'notebook'\n" >> /home/idies/.ipython/profile_default/ipython_kernel_config.py

USER root

ADD startup.sh /opt/
RUN chmod a+x /opt/startup.sh

RUN mkdir /opt/python-lib
ADD python-lib /opt/python-lib/
ADD hscdata/hscdata /opt/python-lib/hscdata

ADD home/* /home/idies/workspace/