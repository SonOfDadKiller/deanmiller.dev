//Vert data

const _cube = 
{
    vertices : [
        //pos				//normal		   //cubePos
        //floor
       -0.5, -0.5, -0.5,   	0.0,  1.0,  0.0,   0.0, 0.0, 0.0,
        0.5, -0.5, -0.5,	0.0,  1.0,  0.0,   0.0, 0.0, 0.0,
        0.5, -0.5,  0.5,	0.0,  1.0,  0.0,   0.0, 0.0, 0.0,
       -0.5, -0.5,  0.5,	0.0,  1.0,  0.0,   0.0, 0.0, 0.0,
       //roof
       -0.5, 0.5, -0.5,		0.0,  1.0,  0.0,   0.0, 0.0, 0.0,
        0.5, 0.5, -0.5,		0.0,  1.0,  0.0,   0.0, 0.0, 0.0,
        0.5, 0.5,  0.5,		0.0,  1.0,  0.0,   0.0, 0.0, 0.0,
       -0.5, 0.5,  0.5,		0.0,  1.0,  0.0,   0.0, 0.0, 0.0,
       //wall (facing z)
       -0.5, -0.5, -0.5,	0.0,  0.0,  1.0,   0.0, 0.0, 0.0,
       -0.5,  0.5, -0.5,	0.0,  0.0,  1.0,   0.0, 0.0, 0.0,
        0.5,  0.5, -0.5,	0.0,  0.0,  1.0,   0.0, 0.0, 0.0,
        0.5, -0.5, -0.5,	0.0,  0.0,  1.0,   0.0, 0.0, 0.0,
        //wall (facing -x)
        0.5, -0.5, -0.5,    1.0,  0.0,  0.0,   0.0, 0.0, 0.0,
        0.5, -0.5,  0.5,    1.0,  0.0,  0.0,   0.0, 0.0, 0.0,
        0.5,  0.5,  0.5,    1.0,  0.0,  0.0,   0.0, 0.0, 0.0,
        0.5,  0.5, -0.5,    1.0,  0.0,  0.0,   0.0, 0.0, 0.0,
        //wall (facing -z)
       -0.5,  0.5,  0.5,	0.0,  0.0,  1.0,   0.0, 0.0, 0.0,
        0.5,  0.5,  0.5,	0.0,  0.0,  1.0,   0.0, 0.0, 0.0,
        0.5, -0.5,  0.5,	0.0,  0.0,  1.0,   0.0, 0.0, 0.0,
       -0.5, -0.5,  0.5,	0.0,  0.0,  1.0,   0.0, 0.0, 0.0,
        //wall (facing x)
       -0.5, -0.5, -0.5,    1.0,  0.0,  0.0,   0.0, 0.0, 0.0,
       -0.5, -0.5,  0.5,    1.0,  0.0,  0.0,   0.0, 0.0, 0.0,
       -0.5,  0.5,  0.5,    1.0,  0.0,  0.0,   0.0, 0.0, 0.0,
       -0.5,  0.5, -0.5,    1.0,  0.0,  0.0,   0.0, 0.0, 0.0
    ],
    
    indices : [
        //floor
        0, 1, 3,
        1, 2, 3,
        //roof
        4, 5, 7,
        5, 6, 7,
        //wall (facing z)
        8, 9, 11,
        9, 10, 11,
        //wall (facing -x)
        12, 13, 15,
        13, 14, 15,
        //wall (facing -z)
        16, 17, 19,
        17, 18, 19,
        //wall (facing x)
        20, 21, 23,
        21, 22, 23
    ]
}



export const cube = _cube;