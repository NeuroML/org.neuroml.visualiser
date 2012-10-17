package org.neuroml.visualiser.services;

import org.neuroml.visualiser.model.MorphologyProtos.AGet3DSceneService.Interface;
import org.neuroml.visualiser.model.MorphologyProtos.NeuroMLURL;
import org.neuroml.visualiser.model.MorphologyProtos.Scene;

import com.google.protobuf.RpcCallback;
import com.google.protobuf.RpcController;

public class Get3DSceneService implements Interface{

	@Override
	public void get3DScene(RpcController controller, NeuroMLURL request,
			RpcCallback<Scene> done) {
		// TODO Auto-generated method stub
		
	}

}
