function get3DScene()
{
	$.ajax({type : 'POST',
			url : '/org.neuroml.visualiser/Get3DSceneServlet',
			data: {url:"http://www.opensourcebrain.org/projects/celegans/repository/revisions/master/raw/CElegans/generatedNeuroML2/RIGL.nml"},
			timeout : 10000,
			success : function(data, textStatus) { 
				loadScene(); 
				},
			error : function(xhr, textStatus, errorThrown) { 
				alert("Error getting scene!"+textStatus+" ET "+errorThrown); 
				}
	});
}

$(document).ready(function(){
	get3DScene();
});




window.requestAnimFrame = (function(callback){
    return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback){
        window.setTimeout(callback, 1000 / 60);
    };
})();

function animate(lastTime, angularSpeed, three){
    // update
    var date = new Date();
    var time = date.getTime();
    var timeDiff = time - lastTime;
    var angleChange = angularSpeed * timeDiff * 2 * Math.PI / 1000;
    three.group.rotation.z += angleChange;
    lastTime = time;
    
    // render
    three.renderer.render(three.scene, three.camera);
    
    // request new frame
    requestAnimFrame(function(){
        animate(lastTime, angularSpeed, three);
    });
}

function loadScene() {
    var angularSpeed = 0.2; // revolutions per second
    var lastTime = 0;
    
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    // camera
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 1000;
    
    // scene
    var scene = new THREE.Scene();
    
    // cylinder
    var material = new THREE.MeshLambertMaterial({
        color: 0x0000ff
    });
   
    
    var sphere = new THREE.Mesh( new THREE.SphereGeometry(130,16,50), material);
    var cylinder = new THREE.Mesh(new THREE.CylinderGeometry(50, 100, 200, 50, 50, false ),material);
    sphere.position.set( 10, 0, 10 );
    cylinder.position.set( 10, 180, 10 );
    var cylinder2 = new THREE.Mesh(new THREE.CylinderGeometry(50, 50, 200, 50, 50, false ),material);
    cylinder2.position.set( 10, 380, 10 );
    
    group = new THREE.Object3D();//create an empty container
    
    group.add(sphere);
    group.add(cylinder);
    group.add(cylinder2);
    scene.add(group);
    
    // add subtle ambient lighting
    var ambientLight = new THREE.AmbientLight(0x555555);
    scene.add(ambientLight);
    
    // add directional light source
    var directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);
    
    // create wrapper object that contains three.js objects
    var three = {
        renderer: renderer,
        camera: camera,
        scene: scene,
        group: group
    };
    
    animate(lastTime, angularSpeed, three);
};