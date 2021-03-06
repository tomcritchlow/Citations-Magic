var alldata;
var allKeys;
var alljson = [];

document.addEventListener("DOMContentLoaded", function(){
  chrome.storage.local.get(null, function(items) {
    allKeys = Object.keys(items);
    alldata = items;

    console.log(alldata);

    for( var i in items){

      alljson.push(items[i]);

      const article_fragment = document.getElementById('articleItem');
      const article_instance = document.importNode(article_fragment.content, true);
      // Add relevant content to the template

      var domain = extractHostname(items[i].url);
      article_instance.querySelector('.title').innerHTML = items[i].title;
      // article_instance.querySelector('.author').innerHTML = items[i].author;
      article_instance.querySelector('.mini-favicon').src = "https://s2.googleusercontent.com/s2/favicons?domain_url="+domain+"";
      article_instance.querySelector('.url').innerHTML = domain;
      article_instance.querySelector('.article').setAttribute("data-id",items[i].url);

      // Append the instance ot the DOM
      document.getElementById('article-scrollContainer').appendChild(article_instance);
    }

    alljson = JSON.stringify(alljson);
    alljson = JSON.parse(alljson);

    var pagehash = $(location).attr('hash').replace("#","");

    if($(location).attr('hash')){
      if(allKeys.includes(pagehash)){ // error handling for some mishandled hash value
        displayquotes(pagehash)
    }else{
      displayquotes(allKeys[0]);
    };
    }else{
      displayquotes(allKeys[0]);
    }

    window.addEventListener('hashchange', function() {
      var hashval = $(location).attr('hash').replace("#","");
      if(allKeys.includes(hashval)){ // check hash is a valid entry in data
        displayquotes(hashval)
      };
    }, false);
      
    $( ".article" ).click(function() {
      var url = $(this).attr('data-id');
      displayquotes(url);

    });
    
    $('#rightpanel').on('click',"#copy", function() {
      console.log("copying?");
      var quote = $(this).closest('.quoteblock').find('.portal-content-519256').text();
      copyToClipboard(quote);
      var el = $(this);
      el.html("Copied!");
      setTimeout(function() {
        el.html("Copy Text");
      }, 1000);
    });

    $('#rightpanel').on('click',"#embedLink", function() {
      
      var title = $(".selected").find(".title").text();
      var url = $(".selected").attr("data-id");
      var quote = $(this).closest('.quoteblock').find('.portal-content-519256').html();
      var author = $(this).closest('.quoteblock').find('.portal-author-519256').text();

      const embed_fragment = document.getElementById('embed');
      const embed = document.importNode(embed_fragment.content, true);
      // Add relevant content to the template
      embed.querySelector('.portal-author-519256').innerHTML = author;
      embed.querySelector('.title-wrapper-519256').innerHTML = title;
      embed.querySelector('.portal-arrow-519256').setAttribute("href", url);
      embed.querySelector('.portal-content-519256').innerHTML = quote;
      embed.querySelector('.mini-favicon-519256').src = "https://s2.googleusercontent.com/s2/favicons?domain_url="+url+"";
    
      let div=document.createElement("div");
      div.appendChild(embed);

      copyToClipboard(div.innerHTML);

      var el = $(this);
      el.html("Copied!");
      setTimeout(function() {
        el.html("<> Embed");
      }, 1000);
    });


    // use html2screenshot to generate canvas, copy img to clipboard
    $('#rightpanel').on('click',"#copyimg", function() {
      var el = $(this);

      var element = $(this).closest('.quoteblock').find('.portal-container-519256');

      html2canvas(element[0], {
        useCORS: true
      }).then((canvas) => {
        canvas.toBlob(function(blob) {
          console.log("Writing to clipboard");
          const item = new ClipboardItem({ "image/png": blob });
          navigator.clipboard.write([item]).then(
            function() {
              console.log("Copied to clipboard successfully!");
              el.html("Copied!");
              setTimeout(function() {
                el.html("Copy Image");
              }, 1000);
            },
            function(error) {
              console.error("unable to write to clipboard. Error:");
              console.log(error);
            }
          );
        });
      }).catch(function (error) {
          console.log('oops, something went wrong!', error);
      });

  });


    // DELETE QUOTE
    $('#rightpanel').on('click',"#delete", function() {
      
      var r = confirm("Are you sure you want to delete this quote?");
      if (r == true) {
        
        var url = $(".selected").attr("data-id");
        var quoteblock = $(this).closest('.quoteblock');
        var index = $(".quoteblock").index(quoteblock);
        var quotes = alldata[url]["quotes"];
        var removed = quotes.splice(index,1);
        alldata[url]["quotes"] = quotes;
        if(quotes.length == 0){ //if no quotes left then delete whole item from alldata
          chrome.storage.local.remove(url, function (){
            console.log("deleted "+url);
            $(".selected").hide();
            displayquotes(url);
          });
        }else{
        chrome.storage.local.set(alldata, function(){ 
          console.log("saving data");
          displayquotes(url);
        }); 
      }
      
      } else {
      } 
    });    

    // DELETE ARTICLE
    $('#titlebar').on('click',"#titlebar-delete", function(){
      var r = confirm("Are you sure you want to delete this entire article?")
      if (r == true) {
        var url = $(".selected").attr("data-id");
        chrome.storage.local.remove(url, function(){ // delete entire item from alldata
          console.log("deleted article "+url);
          $(".selected").hide();
          if(url == allKeys[0]){
            displayquotes(allKeys[1]);          
          }else{
            displayquotes(allKeys[0]);          
          };
        });
      }else{
      }
    });

    // CLEAR STORAGE
    document.getElementById("clearStorage").onclick = function(){
      var r = confirm("Are you sure you want to delete all citations?!");
      if (r == true) {
        chrome.storage.local.clear()
      } else {
      } 
    };

    // Export function
    document.getElementById("exportQuotes").onclick = function(){
      var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(alldata, null, 2));
      var d = new Date();
      var curr_date = d.getDate();
      var curr_month = d.getMonth() + 1; //Months are zero based
      var curr_year = d.getFullYear();
      var a = document.createElement("a");
      a.setAttribute("href",     dataStr     );
      a.setAttribute("download", curr_date + "-" + curr_month + "-" + curr_year +"-quoteback.json");
      a.click();
    };


    // on title/author -> trigger autosave
    $( "#rightpanel" ).on("focus" , "#titlebar-author", function() {
      var el = $(this);
      var url = $(".selected").attr("data-id");
      var object = alldata[url];
      AutoSaveTitle.start(object, el ,url);
      $("#titlebar-author").keypress(function(e){ // prevent return in title
        if(e.which == 13){
          $("#titlebar-author").blur();
        }
        return e.which != 13;
        
       });
    });

    $( "#rightpanel" ).on("focusout" , "#titlebar-author", function() {
      AutoSaveTitle.stop();
    });

    $( "#rightpanel" ).on("focus" , "#titlebar-title", function() {
      var el = $(this);
      var url = $(".selected").attr("data-id");
      var object = alldata[url];
      AutoSaveTitle.start(object, el ,url);
      $("#titlebar-title").keypress(function(e){ // prevent return in title
        if(e.which == 13){
          $("#titlebar-title").blur();
        }
        return e.which != 13;
        
       });
    });

    $( "#rightpanel" ).on("focusout" , "#titlebar-title", function() {
      AutoSaveTitle.stop();
    });
    
    
    
    // on focus comment box -> trigger autosave
    $( "#rightpanel" ).on("focus" , ".comment", function() {
      
      var url = $(".selected").attr("data-id");
      var object = alldata[url];
      console.log($(this).text());
      if($(this).text() == "Add comment"){
        $(this).text("");
      };
      $(this).css("color","#464A4D")
      var el = $(this);
      AutoSave.start(object, el , $(this).index(".comment"),url);
    });

    // on focusout comment box -> stop autosave
    $( "#rightpanel" ).on("focusout" , ".comment", function() {
      AutoSave.stop();
    });    

  });
});


function displayquotes(url){
  document.getElementById('panel-scrollContainer').innerHTML = "";

  window.location.hash = url;

  const fragment = document.getElementById('quote');

  var offset = $(".article[data-id='"+url+"']").offset();
  $("#article-scrollContainer").scrollTop(offset.top);
    
  alldata[url].quotes.forEach(item => {
    // Create an instance of the template content
    const instance = document.importNode(fragment.content, true);

    // Add relevant content to the template
    instance.querySelector('.portal-content-519256').innerHTML = item.text;
    instance.querySelector('.linkback a').href = url;
    // try making the "view original" link use the text fragment spec. Janky af.
    //instance.querySelector('.linkback a').href = url + "#:~:text=" + item.text.substring(0,20);
    instance.querySelector('.portal-arrow-519256').href = url;
    instance.querySelector('.title-wrapper-519256').innerHTML = alldata[url].title;
    instance.querySelector('.portal-author-519256').innerHTML = alldata[url].author;
    instance.querySelector('.mini-favicon-519256').src = "https://s2.googleusercontent.com/s2/favicons?domain_url="+url+"";

    var date = new Date(item.date);
    console.log(date); // date is a timestamp but we only display formatted
    var dd = String(date.getDate()).padStart(2, '0');
    var mm = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = date.getFullYear();
    
    date = mm + '/' + dd + '/' + yyyy;
    instance.querySelector('.date').innerHTML += date;

    if(item.comment){
     instance.querySelector('.comment').innerHTML = item.comment;
     instance.querySelector('.comment').style.color = "#464A4D";
    }else{
      instance.querySelector('.comment').innerHTML = "Add comment";
    };

    
    // Append the instance ot the DOM
    document.getElementById('panel-scrollContainer').appendChild(instance);

    $( ".article" ).each(function() {
      $( this ).removeClass( "selected" );
    });

    $(".article[data-id='"+url+"']").addClass( "selected" );

    // Update the Title Bar
    var titlebar = document.getElementById('titlebar');
    titlebar.querySelector("#titlebar-author").innerHTML = alldata[url].author;
    titlebar.querySelector("#titlebar-title").innerHTML = alldata[url].title;

  });
};

// COPY TO CLIPBOARD

const copyToClipboard = str => {
  const el = document.createElement('textarea');
  el.value = str;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};

function extractHostname(url) {
  var hostname;
  //find & remove protocol (http, ftp, etc.) and get hostname

  if (url.indexOf("//") > -1) {
      hostname = url.split('/')[2];
  }
  else {
      hostname = url.split('/')[0];
  }
  return hostname 
};



// HOVER TO SHOW CONTROLS

$(document).on('mouseenter mouseleave', '.quoteblock', function(e) {
    if (e.type == "mouseenter"){

      $(this).find('.quote-controls').addClass('showcontrols');
    }else{
      $(this).find('.quote-controls').removeClass('showcontrols');
    }
});


// AUTOSAVE FUNCTION
var AutoSave = (function(){
  var timer = null;

  function save(object, el, index, url){
    console.log("running save");
    console.log(el);
    alldata[url]["quotes"][index]["comment"] = el.text();
    chrome.storage.local.set(alldata, function(){ 
      console.log("autosaved");
    });          
  };

  function restore(){ //don't think I actually need this restore function...?
    var page = document.location.href;
    var saved = "";
    chrome.storage.local.get([page], function(result) {
        saved = result[page]["quotes"][0]["comment"];
    });

    var editor = getEditor();
    if (saved && editor){
      editor.value = saved; 
    }
  }

  return { 

    start: function(object, el, index, url){

      if (timer != null){
        clearInterval(timer);
        timer = null;
      }
      timer = setInterval(function(){
                save(object, el, index, url)
            }, 1000);
    },

    stop: function(){

      if (timer){ 
        clearInterval(timer);
        timer = null;
      }

    }
  }
}());

// AUTOSAVE Meta Title / Author FUNCTION
var AutoSaveTitle = (function(){
  var timer = null;

  function save(object, el, url){
    console.log("running autosavetitle");
    console.log(el);
    var author = document.getElementById("titlebar-author").textContent;
    var title = document.getElementById("titlebar-title").textContent;
    alldata[url]["author"] = author;
    alldata[url]["title"] = title;
    chrome.storage.local.set(alldata, function(){ 
      console.log("autosaved");
    });          
  };

  return { 

    start: function(object, el, url){

      if (timer != null){
        clearInterval(timer);
        timer = null;
      }
      timer = setInterval(function(){
                save(object, el, url)
            }, 1000);
    },

    stop: function(){

      if (timer){ 
        clearInterval(timer);
        timer = null;
      }

    }
  }
}());


document.addEventListener("DOMContentLoaded", function(){
  $(".comment").resizable();
});

// $("#leftnav").resizable({
//     // only use the eastern handle
//     handles: 'e',
//     // restrict the width range
//     minWidth: 120,
//     maxWidth: 450,
//     // resize handler updates the content panel width
//     resize: function(event, ui){
//         var currentWidth = ui.size.width;

//         // this accounts for padding in the panels + 
//         // borders, you could calculate this using jQuery
//         var padding = 12; 

//         // this accounts for some lag in the ui.size value, if you take this away 
//         // you'll get some instable behaviour
//         $(this).width(currentWidth);

//         // set the content panel width
//         $("#rightpanel").width(containerWidth - currentWidth - padding);            
//     }
// });