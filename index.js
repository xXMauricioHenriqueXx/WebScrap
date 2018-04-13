let http 		= require("http")
	,app 		= require("express")()
	,cheerio 	= require("cheerio")
	,fs 		= require("fs")
	,request 	= require("request")
	,download 	= require('image-downloader')
	,rootPath 	= "./site"
	,base		= "http://devitems.com/preview/tmart"
	,site 		= "http://devitems.com/preview/tmart/index.html";
	
//Baixa as imagens da URL passada por parametro
function downloadImage(url, dest){
	
	console.log('Downloading image from : ', url);
	
	const options = {
	  url: url,
	  dest: dest                  
	}
	
	download.image(options).then(({ filename, image }) => {
    	
  	}).catch((err) => {
   		throw err
  	});
}

//Verifica se o arquivo é uma image
function isImage(file){
	
	const types = ['png', 'jpg', 'gif', 'svg'];
	
	return new Promise((resolve, reject) =>{
		
		if(file){
			
			types.map(type =>{
				if(file.includes(type)){
					resolve(true);
				}
			});

		}
	});
}

function isCSS(file){

	return new Promise((resolve, reject) =>{
		if(file){
			if(file.includes('.css')){
				resolve(true);
			}
		}
	});
}

function isJS(file){

	return new Promise((resolve, reject) => {
		
		if(file.includes('.js')){
			resolve(true);
		}

	});
}

function isInvalid(file){
	
	const types = ['http', 'https'];
	return new Promise((resolve,reject) =>{
		if(file){
			types.map(type => {
				if(!file.includes(type)){
					resolve(false);
				}
			});
		}			
	});	
}

function writeFile(url, path, msg){
	return new Promise((resolve, reject) => {

		request(url, (error, response, body) => {
			resolve({msg: msg});
			createFiles(path, body).then().catch(err => {
				reject({msg: err});
			});
		});		
	});
}

function formatLinks(link){
	
	while(link.includes('../')){
		link = link.substr(3, link.length);
	}

	return link;
}
function extractPath(path){
	
	let paths = path.split('/');

	return new Promise((resolve, reject) => {
		
		paths.map(p => {			

			isImage(p).then(data => {
				
				if(data){
					
					resolve({
						folder: paths,
						file: p,
						type: 'img'						
					});
					
					paths.splice(paths.indexOf(p), 1);
				}

			}).catch((err) => {});
			
			
			isCSS(p).then(data => {

				if(data){
					
					if(paths.indexOf(p) + 1 == paths.length){
						
						resolve({
							folder: paths,
							file: p,
							type: 'css'
						});							
						paths.splice(paths.indexOf(p), 1);						
					}
				}

			}).catch((err) => {});

			isJS(p).then(data => {

				if(data){
					resolve({
						folder: paths,
						file: p,
						type: 'js'
					});
					
					paths.splice(paths.indexOf(p), 1);
				}

			}).catch((err) => {});

		});
		
	});	
}

function extractCSS($){
	
	return new Promise((resolve, reject) => {
		if($){
			$('link').each((i, elem	) => {
				
				let link = elem.attribs.href;

				isInvalid(link).then(data => {
					
					if(!data){
					
						link = formatLinks(link);
						
						extractPath(link).then(paths => {

							paths.folder.map(folder => {
								
								raiz += `/${ folder }`;
								createFolders(raiz).then().catch(err => {
									
								});
								
								
								if(paths.folder.indexOf(folder) + 1 == paths.folder.length){
									
									let url = `${ base }/${ link }`;
									let path = `${ raiz }/${ paths.file }`;
								
									if(paths.type == 'css'){
										
										writeFile(url, path, `Creating CSS file in : ${ path }`).then(data => {
											console.log(data.msg);
										}).catch(err => {
											console.log(err.msg);
										});														
									}

									if(paths.type == 'img'){
										downloadImage(url, raiz);
									}
									
								}
							});				
						 }).catch(err => {});				

						let raiz = rootPath;					
						
					}	

				}).catch(err => {
					
				});	
					
			});						
		}else{
			reject({msg: "$ undefined"});
		}
	});

}


function extractImage($){
	
	return new Promise((resolve, reject) => {
		
		if($){

			$('img').each((i, elem	) => {
				
				let img = elem.attribs.src;

				isInvalid(img).then(data => {
					
					if(!data){
						
						img = formatLinks(img);
						let raiz = rootPath;
						
						extractPath(img).then(paths => {

							paths.folder.map(folder =>{

								raiz += `/${ folder }`;
								createFolders(raiz).then().catch(err => {
									
								});	
								
								if(paths.folder.indexOf(folder) + 1 == paths.folder.length){
									
									let url = `${ base }/${ img }`;
									downloadImage(url, raiz);				
									
								}
							});

						}).cath(err => {})
					}	
				
				}).catch(err => {
					
				});				
			});
		}else{
			reject({msg:"$ undefined"});
		}
	});

}

function extractJS($){
	
	return new Promise((resolve, reject) => {

		if($){

			$('script').each((i, elem	) => {
		
				let script = elem.attribs.src;
				
				isInvalid(script).then(data => {
					
					if(!data){						
						
						script = formatLinks(script);
						let raiz = rootPath;
						
						extractPath(script).then(paths => {
							
							paths.folder.map(folder => {

								raiz += `/${ folder }`;
								createFolders(raiz).then().catch(err => {
									
								});	

								if(paths.folder.indexOf(folder) + 1 == paths.folder.length){
									
									let url = `${ base }/${ script }`;
									let path = `${ raiz }/${ paths.file }`;
									

									writeFile(url, path, `Creating JS file in : ${ path }`).then(data => {
										console.log(data.msg);
									}).catch(err => {
										console.log(err.msg);
									});									
								}					
							});				

						}).cath(err => {});
					}
				
				}).catch(err => {
					
				});		
			});
		}else{
			reject({msg:'$ undefined'});
		}

	});

	
}


function createFolders(path){
	return new Promise((resolve,reject) => {

		if (!fs.existsSync(path)){
			fs.mkdirSync(path);										
		}		
	});
}

function createFiles(path, file){
	return new Promise((resolve, reject) => {
		fs.writeFile(path, file, (err) =>{
			if(err){
				reject({msg: err});
			}
		});
	});
}

function end(){
	setTimeout(function() {
		console.log('Extração finalizada...');
		process.exit(1);		
	},15000);
}

async function generate(){
	request(site, (error, response, body) =>{
		if(!error){		
			
			body = body.replace("../","./");
			fs.writeFile(`${ rootPath }/home.html`, body, (err) =>{
				if(err){
					console.log(err);
				}
			});	

			$ = cheerio.load(body);
			
			 Promise.all([extractCSS($), extractImage($), extractJS($)]).then(result => {
						
			}).catch(err => {
				console.log(err);
			});		

			
		}
	});			
}

http.createServer(app).listen(() => {
	console.log('Extração iniciada...');	
	generate();
	
});