import Solution  from "./SolutionClass.js";
import fs from 'fs'
import fse from 'fs-extra'
import path from "path";
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const fs_promise = fs.promises

let solution_manager = (project_name, target_project_name)=>{
    if(!project_name) return console.error('No hay analisis para este proyecto...')
    get_vul(project_name)
    .then((data)=>{
        // data contiene arreglo de objetos de vulnerabilidades
        let ver;
        if(!fs.existsSync(`./project_source/${target_project_name}`)){
            fs.mkdirSync(`./project_source/${target_project_name}/${target_project_name}_v1`,{recursive:true})
            ver = 'v1'
        }else{
            let versions = fs.readdirSync(`./project_source/${target_project_name}`).length
            
            fs.mkdir(`./project_source/${target_project_name}/${target_project_name}_v${versions}`,{},(err)=>{
                if(err.code !== 'EEXIST'){
                    console.log(err)
                }else{
                    console.log('Create project_version_dir Skiped')
                }
            })
            
            ver = `v${versions}`
            
        }
        fs.mkdir(`./project_source/${target_project_name}/${target_project_name}_${ver}`,(err)=>{
            if('e',err.code==='EEXIST'){
                return
            }else{
                console.error(err)
            }
        })
        
        fse.copySync(`./project_source/root_projects/${target_project_name}`,`./project_source/${target_project_name}/${target_project_name}_${ver}`,{overwrite:true,recursive:true,errorOnExist:false});
        
        let project_folder = `./project_source/${target_project_name}/${target_project_name}_${ver}`

        

        data.forEach((vul,index)=>{
            let sol = new Solution(target_project_name, project_folder, ver, vul)
            let solution_identi = sol.comprobe_vul_sol(vul)
            let state
            if(!!solution_identi){
                
                state = sol.perform_solution()
                
            }
        })
        
    })
    .catch((err)=>console.error('Saliendo debido a error'+err))

}



let get_vul = async (project_name)=>{
    try{
        let vul = await fs_promise.readFile('./temp/json/va161122_analisys_result.json');
        let data = JSON.parse(vul);
        
        return data
    }catch(err){
        console.error(err)
        return err
    }
}


export {solution_manager}