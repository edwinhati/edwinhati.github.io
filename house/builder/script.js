const root = document.documentElement;
const m = document.querySelector("#m");
const b = document.querySelector("#b");
const button = document.querySelector("#button");
const reveal = document.querySelectorAll(".reveal");
const reveal2 = document.querySelectorAll(".reveal2");
const reveal3 = document.querySelectorAll(".reveal3");
const btn = document.querySelectorAll(".btn")
const btns = document.querySelector(".btns")

const schema = {

    schema0 : {
        s1: "hsl(200, 30%, 100%)",
        s2: "hsl(200, 30%, 97%)",
        s3: "hsl(200, 30%, 94%)",
        s4: "hsl(200, 30%, 91%)",
        s5: "hsl(200, 30%, 88%)",

        s6: "hsl(245, 51%, 80%)",
        s7: "hsl(245, 51%, 75%)",
        s8: "hsl(245, 51%, 65%)",

        s9: "hsl(100, 21%, 95%)",
        s10: "hsl(100, 21%, 85%)",


        s11: "hsl(279, 13%, 52%)",
        s12: "hsl(278, 14%, 45%)",
        s13: "hsl(268, 15%, 45%)",
    },
    schema1 : {
        s1: "hsl(12, 76%, 90%)",
        s2: "hsl(12, 76%, 87%)",
        s3: "hsl(12, 76%, 84%)",
        s4: "hsl(12, 76%, 81%)",
        s5: "hsl(12, 76%, 78%)",

        s6: "hsl(200, 30%, 88%)",
        s7: "hsl(200, 30%, 83%)",
        s8: "hsl(200, 30%, 78%)",

        s9: "hsl(200, 30%, 95%)",
        s10: "hsl(200, 30%, 90%)",

        s11: "hsl(279, 13%, 52%)",
        s12: "hsl(278, 14%, 45%)",
        s13: "hsl(268, 15%, 45%)",
    },
    schema2 : {
        s1: "hsl(197, 37%, 100%)",
        s2: "hsl(197, 37%, 97%)",
        s3: "hsl(197, 37%, 94%)",
        s4: "hsl(197, 37%, 91%)",
        s5: "hsl(197, 37%, 88%)",

        s6: "hsl(54, 70%, 80%)",
        s7: "hsl(54, 70%, 75%)",
        s8: "hsl(54, 70%, 65%)",

        s9: "hsl(54, 70%, 90%)",
        s10: "hsl(54, 70%, 85%)",

        s11: "hsl(279, 13%, 52%)",
        s12: "hsl(278, 14%, 45%)",
        s13: "hsl(268, 15%, 45%)",
    }

}
/*---------------------*/
/*---------------------*/

let base = (e) => {
    let  x = e.pageX / window.innerWidth - 0.5;
    let  y = e.pageY / window.innerHeight - 0.5;
    b.style.transform = `
        perspective(10000px)
        rotateX(${ y * 20  + 70}deg)
        rotateZ(-${ x * 120  + 40}deg)
    `;
}

let debug = (e) => {
    reveal2.forEach((r, k) =>  setTimeout( () =>  r.classList.toggle("reveal2") , k * 500 ) );
    reveal.forEach((r, i) => setTimeout( () =>  r.classList.toggle("reveal") , 500 + (i * 100)) );
    reveal3.forEach((r, j) => setTimeout( () =>  r.classList.toggle("reveal3") , 4000 + (j * 100)) );

    button.style.display = "none";
    btns.style.display = "flex";
}
/*---------------------*/
/*---------------------*/
let createCube = (e) =>{
    let s = e.target.id.split('-')[1];

    root.style.setProperty('--house-1', schema[`schema${s}`].s1);
    root.style.setProperty('--house-2', schema[`schema${s}`].s2);
    root.style.setProperty('--house-3', schema[`schema${s}`].s3);
    root.style.setProperty('--house-4', schema[`schema${s}`].s4);
    root.style.setProperty('--house-5', schema[`schema${s}`].s5);

    root.style.setProperty('--tree-1', schema[`schema${s}`].s6);
    root.style.setProperty('--tree-2', schema[`schema${s}`].s7);
    root.style.setProperty('--tree-3', schema[`schema${s}`].s8);

    root.style.setProperty('--grass-1', schema[`schema${s}`].s9);
    root.style.setProperty('--grass-2', schema[`schema${s}`].s10);

    root.style.setProperty('--way-2', schema[`schema${s}`].s11);
    root.style.setProperty('--way-1', schema[`schema${s}`].s11);
    root.style.setProperty('--way-2', schema[`schema${s}`].s12);



}
/*************************/
/*************************/
m.addEventListener("mousemove", base);
button.addEventListener("click", debug);
btn.forEach( b => b.addEventListener("click", createCube) )