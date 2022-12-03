import {Analisys} from './services/project_analizer/index.js'
import {solution_manager} from './services/operation_handler/index.js'

const vul_example = {
    "_id": "4efcc894-0150-44a8-810a-b7961950ac2b",
    "name": "Dangerous_Functions",
    "type_no": 0,
    "root_file": "DlgValidacionResolDes.cpp",
    "affected_file": "DlgValidacionResolDes.cpp",
    "root_line": "281",
    "affected_line": "281",
    "root_object": "sprintf",
    "affected_object": "sprintf",
    "root_method": "bool CDlgValidacionResolDes::cargarImagenID( char* cNombreImagen, int iLead)",
    "root_vulnerability_lines": [
        "281. sprintf(cTipo,'%ld', iLead + 153);"
    ]
}





async function rust(args){
    
    switch(args[2]){
        case 'analize':
            run_analysis(args[3]);
            break;
        case 'test_op':                         
            await run_testOp(args[3],args[4]) //args[ node, rust, test_op, va161122 VALIDADOR_16112022 ]
            break;
        default:
            break;
        
    }

}


function run_testOp(project_name, target_project_name ){
    try{
        solution_manager(project_name, target_project_name)
        
    }catch(err){
        console.error(err)
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
