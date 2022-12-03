import fs from 'fs'
const fsPromises = fs.promises

async function sol_sprintf(vul_json, project_folder) {
    let {
        _id,
        name,
        root_file,
        root_line,
        root_object,
        root_method,
        root_vulnerability_lines } = vul_json;

    let required_header = '#include <strsafe.h>'
    try {
        // obtener parametros de fprintf
        
        let params = get_fun_params(root_vulnerability_lines[0].split(""))
        let fun = construct_new_function(params)

        let data = await fsPromises.readFile(project_folder + '/'+root_file,'utf8')
        data = data.split(/\r?\n/)
        data = insert_function(data,fun,root_line)
        data = data.join('\r\n')
        fs.writeFileSync(project_folder+'/'+root_file,data)
        

    } catch (err) {
        console.log(err)
    }

}

function insert_function(data_arr,fun, line){
    
    data_arr.splice(parseInt(line-1),1,fun+`//${data_arr[line-1]}`)
    return data_arr
}

function insert_header(data_arr,header){
    let insert_index;
    data_arr.forEach((el,index)=>{
        if(el.split("").includes('#')){
            insert_index = index+1
        }
    })
    data_arr.splice(insert_index,0,header)
    
    return data_arr
}

function construct_new_function(params) {
    return `StringCchPrintf(${params[0]}, sizeof(${params[0]}), ${[...params].slice(1)});`
}


function get_fun_params(string) {
    let accum = 0;
    
    
    let params_text = string.map((char,index)=>{
        if(['(', '{', '['].includes(char)){
            accum++
        }
        if([')', '}', ']'].includes(char)){
            accum--
        }
        if(accum>0){
            return char
        }else{
            return ''
        }
    })
    params_text.push(')')
    let s = params_text.join("")
    s = s.split('')
    s.pop()
    s.shift()
    s = s.join("")
    s = s.split(',')
    

    // let params_text = string.map((char, index) => {
    //     let c = ''
    //     if (['(', '{', '['].includes(char)) {
    //         accum++
    //         return c
    //     }
    //     if ([')', '}', ']'].includes(char)) {
    //         accum--
    //         return c
    //     }
    //     if (accum > 0) {
    //         if (char === ',' && accum === 1) {
    //             c = '_'
    //         } else {
    //             c = char
    //         }
    //     }
    //     return c

    // })
    
    return s
}


export default sol_sprintf