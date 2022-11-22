import {Analisys} from './services/project_generator/index.js'


function rust(args){
    
    switch(args[2]){
        case 'analize':
            run_analysis(args[3]);
            break;
        default:
            break;
        
    }

}



async function run_analysis(pdf_name){
    let ana = new Analisys(
        "luis",
        pdf_name,
    )
    
    let done = await ana.run_analisys()
    if(done === 1){
        ana.saveResults().then(done=>{
            console.log('guardado en :'+ "/temp/json/test1.json")
        })
    }
    
}


rust(process.argv)
