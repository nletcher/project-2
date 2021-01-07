function displayData(id, fData){
    
     var barColor = '#f2b076';
     function segColor(c){ return {'Unknown':"#98abc5",'5-13':"#8a89a6", '14-17':"#7b6888", '18-24': "#6b486b", '25-44': "#a05d56",'45-64': "#d0743c",'>65': "#ff8c00"}[c]; }
     
     // Calc total for each 
     fData.forEach(function(d){
         // definr var values
         var values = Object.values(d.freq);
         d.total = values.reduce(function(a, b) {return a + b;}, 0);
     });


     // function to handle histogram.
     function histoGram(fD){
         var hG={},    
         hGDim = {t: 40, r: 0, b: 50, l: 60};
         hGDim.w = 400 - hGDim.l - hGDim.r, 
         hGDim.h = 300 - hGDim.t - hGDim.b;
             
         //create svg for histogram.
         var hGsvg = d3.select(id).append("svg")
             .attr("width", hGDim.w + hGDim.l + hGDim.r)
             .attr("height", hGDim.h + hGDim.t + hGDim.b).append("g")
             .attr("transform", "translate(" + hGDim.l + "," + hGDim.t + ")");
 
         // create function for x-axis mapping.
         var x = d3.scaleBand().rangeRound([0, hGDim.w]).padding(0.1)
                 .domain(fD.map(function(d) { return d[0]; }));
 
         // Add x-axis to the histogram svg.
         hGsvg.append("g").attr("class", "x axis")
             .attr("transform", "translate(0," + hGDim.h + ")")
             .call(d3.axisBottom(x));
 
         // Create function for y-axis map.
         var y = d3.scaleLinear().range([hGDim.h, 0])
                 .domain([0, d3.max(fD, function(d) { return d[1]; })]);
         var btext = hGsvg.append('text')
                         .attr('x', hGDim.t+120)
                         .attr('y', hGDim.h+30)
                         .style('font-size','12px')
                 btext.append('tspan').text('Year');
                 
         // Add y-axis to the histogram svg.
         hGsvg.append("g").attr("class", "y axis")
             .attr('transform','translate('+ (hGDim.h-205) +',0)')
             .call(d3.axisLeft(y));
         var ltext = hGsvg.append('text')
                               .attr('x', hGDim.t-100)
                               .attr('y', hGDim.h-260)
                               .style('font-size','12px')
                               .attr('transform','rotate(-90,'+hGDim.t +',' +hGDim.t+')');
                 ltext.append('tspan').text('The number of cases');
                 
         // Create bars for histogram to contain rectangles and freq labels.
         var bars = hGsvg.selectAll(".bar").data(fD).enter()
                 .append("g").attr("class", "bar");
         // console.log(fD)
         //create the rectangles.
         bars.append("rect")
             .attr("x", function(d) { return x(d[0]); })
             .attr("y", function(d) { return y(d[1]); })
             .attr("width", x.bandwidth())
             .attr("height", function(d) { return hGDim.h - y(d[1]); })
             .attr('fill',barColor)
             .on("mouseover",mouseover)// mouseover is defined below.
             .on("mouseout",mouseout);// mouseout is defined below.
             
        // Function: mouseover() 
        //
         function mouseover(d){  // utility function to be called on mouseover.
             // filter for selected state.
             var st = fData.filter(function(s){ return s.State == d[0];})[0],
                 nD = d3.keys(st.freq).map(function(s){ return {type:s, freq:st.freq[s]};});
                
             // call update functions of pie-chart and legend.    
             pC.update(nD);
             leg.update(nD);
         }
         
         function mouseout(d){    // utility function to be called on mouseout.
             // reset the pie-chart and legend.    
             pC.update(tF);
             leg.update(tF);
         }
         
         // create function to update the bars. This will be used by pie-chart.
         hG.update = function(nD, color){
             // update the domain of the y-axis map to reflect change in frequencies.
             y.domain([0, d3.max(nD, function(d) { return d[1]; })]);
             
             // Attach the new data to the bars.
             var bars = hGsvg.selectAll(".bar").data(nD);
             
             // transition the height and color of rectangles.
             bars.select("rect").transition().duration(500)
                 .attr("y", function(d) {return y(d[1]); })
                 .attr("height", function(d) { return hGDim.h - y(d[1]); })
                 .attr("fill", color);
 
             // transition the frequency labels location and change value.
             bars.select("text").transition().duration(500)
                 .text(function(d){ return d3.format(",")(d[1])})
                 .attr("y", function(d) {return y(d[1])-5; });            
         }        
         return hG;
     }
     
     // function to handle pieChart.
     function pieChart(pD){
         var pC ={},    pieDim ={w:220, h: 300};
         pieDim.r = Math.min(pieDim.w, pieDim.h) / 2;
                 
         // create svg for pie chart.
         var piesvg = d3.select(id).append("svg")
             .attr("width", pieDim.w).attr("height", pieDim.h).append("g")
             .attr("transform", "translate("+pieDim.w/2+","+pieDim.h/2+")");
         
         // create function to draw the arcs of the pie slices.
         var arc = d3.arc().outerRadius(pieDim.r - 10).innerRadius(0);
 
         // create a function to compute the pie slice angles.
         var pie = d3.pie().sort(null).value(function(d) { return d.freq; });
 
         // Draw the pie slices.
         piesvg.selectAll("path").data(pie(pD)).enter().append("path").attr("d", arc)
             .each(function(d) { this._current = d; })
             .style("fill", function(d) { return segColor(d.data.type); })
             .on("mouseover",mouseover).on("mouseout",mouseout);
 
         // create function to update pie-chart. This will be used by histogram.
         pC.update = function(nD){
             piesvg.selectAll("path").data(pie(nD)).transition().duration(500)
                 .attrTween("d", arcTween);
         }        
         // Utility function to be called on mouseover a pie slice.
         function mouseover(d){
             // call the update function of histogram with new data.
             hG.update(fData.map(function(v){ 
                 return [v.State,v.freq[d.data.type]];}),segColor(d.data.type));
         }
         //Utility function to be called on mouseout a pie slice.
         function mouseout(d){
             // call the update function of histogram with all data.
             hG.update(fData.map(function(v){
                 return [v.State,v.total];}), barColor);
         }
         // Animating the pie-slice requiring a custom function which specifies
         // how the intermediate paths should be drawn.
         function arcTween(a) {
             var i = d3.interpolate(this._current, a);
             this._current = i(0);
             return function(t) { return arc(i(t));    };
         }    
         return pC;
     }
     
     // function to handle legend.
     function legend(lD){
         var leg = {};
             
         // create table for legend.
         var legend = d3.select(id).append("table").attr('class','legend');

         // create one row per segment.
         var tr = legend.append("tbody").selectAll("tr").data(lD).enter().append("tr");
             
         // create the first column for each segment.
         tr.append("td").append("svg").attr("width", '8').attr("height", '8').append("rect")
             .attr("width", '8').attr("height", '8')
             .attr("fill",function(d){ return segColor(d.type); });
             
         // create the second column for each segment.
         tr.append("td").text(function(d){ return d.type;}).style('font-size','11px');
 
         // create the third column for each segment.
         tr.append("td").attr("class",'legendFreq')
             .text(function(d){ return d3.format(",")(d.freq);}).style('font-size','11px');
 
         // create the fourth column for each segment.
         tr.append("td").attr("class",'legendPerc')
             .text(function(d){ return getLegend(d,lD);}).style('font-size','11px');
 
         // Utility function to be used to update the legend.
         leg.update = function(nD){
             // update the data attached to the row elements.
             var l = legend.select("tbody").selectAll("tr").data(nD);
 
             // update the frequencies.
             l.select(".legendFreq").text(function(d){ return d3.format(",")(d.freq);}).style('font-size','11px');
 
             // update the percentage column.
             l.select(".legendPerc").text(function(d){ return getLegend(d,nD);}).style('font-size','11px');        
         }
         
         function getLegend(d,aD){ // Utility function to compute percentage.
             return d3.format(".2%")(d.freq/d3.sum(aD.map(function(v){ return v.freq; })));
         }
 
         return leg;
     }
     
     // calculate total frequency by segment for all state.
     var tF = ['Unknown','5-13','14-17','18-24','25-44','45-64','>65'].map(function(d){ 
         return {type:d, freq: d3.sum(fData.map(function(t){ return t.freq[d];}))}; 
     });    
     //tooltip
    //  var div = d3.select("body").append("div").attr("class", "toolTip");
     // calculate total frequency by state for all segment.
     var sF = fData.map(function(d){return [d.State,d.total];});
 
     var hG = histoGram(sF), // create the histogram.
         pC = pieChart(tF), // create the pie-chart.
         leg= legend(tF);  // create the legend.
 }
 var freqData=[
  {State:'2010',freq:{'Unknown': 37853,'5-13': 3084, '14-17':7238, '18-24': 28688, '25-44': 78132,'45-64':44132,'>65':9458}}
 ,{State:'2011',freq:{'Unknown': 12196,'5-13': 25291, '14-17':6503, '18-24': 27451, '25-44': 75079,'45-64':43839,'>65':9832}}
 ,{State:'2012',freq:{'Unknown': 12565,'5-13': 25061, '14-17':5996, '18-24': 26688, '25-44': 75524,'45-64':44699,'>65':10279}}
 ,{State:'2013',freq:{'Unknown': 12360,'5-13': 22756, '14-17':5408, '18-24': 24650, '25-44': 72493,'45-64':43678,'>65':10447}}
 ,{State:'2014',freq:{'Unknown': 12830,'5-13': 22872, '14-17':5200, '18-24': 24399, '25-44': 74355,'45-64':44092,'>65':10751}}
 ,{State:'2015',freq:{'Unknown': 14240,'5-13': 1936, '14-17':28989, '18-24': 26162, '25-44': 80487,'45-64':49793,'>65':12368}}
 ,{State:'2016',freq:{'Unknown': 16048,'5-13': 1913, '14-17':32845, '18-24': 25975, '25-44': 83252,'45-64':50627,'>65':12525}}
 ];
//  console.log(freqData.State)
 displayData('#v-pills-age',freqData);
