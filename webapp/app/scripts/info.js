var updateInfo = (infos) =>{
  var infotmpl = Netplot.templates.info(infos);
  $('#info').html(infotmpl);
};

module.exports = (infos) => {
  updateInfo(infos);
}
