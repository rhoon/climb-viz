const fs = require('fs');
const d3 = require('d3');
const d3r = require('d3-regression');
const neatCsv = require('neat-csv');

// y_ix are the indices of manually-selected set of logans
// that best represent a vertical 6 feet
// criteria for selection - logan is standing
// and his head is at the top of the image meaning the height of the image
// should correspond to roughly 6ft in physical space
const y_ix = [1, 15, 19, 31, 35, 66, 70, 76, 84, 109, 114];

// x_ix are the indices of a manually-selected set of logans
// that best represent a horizontal 1.33ft (shoulder width)

fs.readFile('20201108_export.csv', async (err, data) => {

  if (err) {
    console.error(err)
    return
  }

  let neatData = await neatCsv(data);

  // create set for linear regression
  let yRegressionSet = [];

  for (i = 0; i < (y_ix.length-1); i++) {

      // set x and y
      let y = neatData[y_ix[i]].Img_Height_px;
      let x = neatData[y_ix[i]].Img_Pos_Y_px;

      yRegressionSet.push([x,y]);

  }

  linearRegression = d3r.regressionLinear()
      .x(d => d[0])
      .y(d => d[1]);

  // trying an expontential regression because
  // the linear regression still produces 'ft above ground' that are demonstrably false
  // (logan's highest point is between 80-90ft - linear says ~200ft)
  expRegression = d3r.regressionExp()
    .x(d => d[0])
    .y(d => d[1]);

  console.log(linearRegression(yRegressionSet));

  console.log(expRegression(yRegressionSet));

  let yReg = linearRegression(yRegressionSet);
  let yRegExp = expRegression(yRegressionSet);
  let expData = neatData;
  //
  // // data transformations
  for (i = 0; i < neatData.length; i++) {


    ft_conversion = 6; // logan is six ft tall - convert to pixels per foot
    mod_conversion = 3.96; // ft_con... is off 50%, forcing overall climb height to be correct

    let linear_predicted_Y = (yReg.predict(neatData[i].Img_Pos_Y_px))/mod_conversion;
    let exp_predicted_Y = (yRegExp.predict(neatData[i].Img_Pos_Y_px))/mod_conversion;

    delete neatData[i].Pixel_Foot;
    delete expData[i].Pixel_Foot;
    delete neatData[i].Speed_Ft_Per_Sec;
    delete expData[i].Speed_Ft_Per_Sec;

    neatData[i].Pixel_Foot = linear_predicted_Y;
    expData[i].Pixel_Foot = exp_predicted_Y;

    console.log('in: '+neatData[i].Img_Pos_Y_px);
    console.log('exp: '+exp_predicted_Y);
    console.log('lin: '+linear_predicted_Y);
    // acknowledging it would be better if there was an X est
    // but also not sure that it can be constructed

  }

  fs.writeFile('updated_est.JSON', JSON.stringify(neatData), function (err) {
      if (err) throw err;
      console.log('updated_est.JSON written');

   });

   fs.writeFile('updated_est_exp.JSON', JSON.stringify(expData), function (err) {
      if (err) throw err;
      console.log('updated_est_exp.JSON written');

   });

   // conclusions
   // known final height from ground is roughly 80ft
   // original segment estimates produce a final height from ground of roughly 200ft
   // linear regressor produces a final height from ground of roughly 200ft
   // exponential regressor produces a final height from ground of roughly 120ft
   // none particularly good - errors of 50-150%
   // mod conversion forces a correct height by fixing the error for exponential regression
   // it's an admittedly hacky solution but produces pretty reasonable estimates

});
