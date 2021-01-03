const fs = require('fs');
const d3 = require('d3');
const d3r = require('d3-regression');
const neatCsv = require('neat-csv');

// y_ix are the indices of manually-selected set of logans
// that best represent a vertical 6 feet
// criteria for selection - logan is standing
// and his head is at the top of the image meaning the height of the image
// should correspond to roughly 6ft in physical space
const y_ix = [1, 15, 19, 31, 35, 66, 70, 76, 84];

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
      .y(d => d[1])
      .domain(1000, 1000);

  console.log(linearRegression(yRegressionSet));

  // y regression results (y = ax + b)
  // a: 0.23884515169866405,
  // b: 20.437657254585105,
  // predict: [Function: fn],
  // rSquared: 0.9897126685634756

  // so 6ft vertical on the image = 0.2388 * Pos_Y_px + 20.4375
  // eg 1 vertical foot  = (0.2388 * Pos_Y_px + 20.4375) / 6
  let yReg = linearRegression(yRegressionSet);
  //
  // // data transformations
  for (i = 0; i < neatData.length; i++) {

    let predicted_Y = (yReg.predict(neatData[i].Img_Pos_Y_px))/6;

    delete neatData[i].Pixel_Foot;
    delete neatData[i].Speed_Ft_Per_Sec;

    neatData[i].Pixel_Foot = predicted_Y;
    // acknowledging it would be better if there was an X est
    // but also not sure that it can be constructed

  }

  fs.writeFile('updated_est.JSON', JSON.stringify(neatData), function (err) {
  if (err) throw err;
  console.log('updated_est.JSON written');
});


});
