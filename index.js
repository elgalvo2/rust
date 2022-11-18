import {Analisys} from './services/project_generator/index.js'

async function run_analysis(){
    let ana = new Analisys(
        "luis",
        "report2",
    )
    
    let done = await ana.run_analisys()
    if(done === 1){
        ana.saveResults().then(done=>{
            console.log('guardado en :'+ "/temp/json/test1.json")
        })
    }
    
}

run_analysis()