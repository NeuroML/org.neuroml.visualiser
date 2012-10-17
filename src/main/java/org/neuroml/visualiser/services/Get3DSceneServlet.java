package org.neuroml.visualiser.services;

import java.io.IOException;
import java.net.URL;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.neuroml.model.Neuroml;
import org.neuroml.model.util.NeuroMLConverter;
import org.neuroml.visualiser.core.MorphologyConverter;
import org.neuroml.visualiser.model.MorphologyProtos.Scene;

/**
 * Servlet implementation class Get3DSceneServlet
 */
public class Get3DSceneServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;

    /**
     * Default constructor. 
     */
    public Get3DSceneServlet() {
        // TODO Auto-generated constructor stub
    }

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		
		try {
			NeuroMLConverter neuromlConverter=new NeuroMLConverter();
			Neuroml neuroml = neuromlConverter.urlToNeuroML(new URL(request.getParameter("url")));
			
			MorphologyConverter morphologyConverter=new MorphologyConverter();
			Scene scene=morphologyConverter.getSceneFromNeuroML(neuroml);
			
			response.setCharacterEncoding("UTF-8");
			response.setContentType("application/protobuf");
			scene.writeTo(response.getOutputStream());
			
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

}
