var Messages = {
  uploaderShort:{
    title: 'Upload project',
    info: 'You can upload a project as a csv and save it in your saved collection bellow.',
  },
  uploaderLong:{
    title: 'Instructions for uploading a project',
    info: 'Only .csv files are supported <br> The column names should follow the following naming convension <br> For a Long formated file the .... lskf',
  },
  wrongFileFormat: {
    title:'Unable to Read File',
    error:'Wrong file format or missing values.'
  },
  projectRoute:{
    title: 'My Projects',
    info: 'Welcome to our App, please browse your projects or upload a new one!',
  },
  toolsRoute: {
    title: 'Visualization Tools',
    info: 'You now can use the tools provided for your project!',
  },
  aboutRoute: {
    title: 'The GRADE NMA project',
    info: 'PLOS paper Abstract',
  },
  longFileUpload: {
    title: 'File seems ok!',
    success: 'Fill in a project name and click proceed to go to the tools.',
  },
  updateInfo : (infos,extra) =>{
    var aux = infos;
    if(extra){
      aux.extra = extra;
    }
    var infotmpl = Netplot.templates.info(aux);
    $('#info').html(infotmpl);
  },
};

module.exports = () => {
  return Messages;
};
