package org.neuroml.visualiser.services;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.File;
import java.io.FilenameFilter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.neuroml.model.Neuroml;
import org.neuroml.model.util.NeuroMLConverter;
import org.neuroml.visualiser.core.MorphologyConverter;
import org.neuroml.visualiser.model.Scene;

import com.fasterxml.jackson.databind.ObjectMapper;

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
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse
	 *      response)
	 */
	protected void doPost(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {

		try {

			URL url = new URL(request.getParameter("url"));

			List<URL> neuroMLfiles = new ArrayList<URL>();
			if (url.getFile().endsWith("nml")) {
				neuroMLfiles.add(url);
			} else {

				if (url.getProtocol().equals("http")) {
					HttpURLConnection urlConnection = (HttpURLConnection) url
							.openConnection();

					InputStream in = new BufferedInputStream(
							urlConnection.getInputStream());
					BufferedReader br = new BufferedReader(
							new InputStreamReader(in));
					String line = null;

					while ((line = br.readLine()) != null) {
						addURLIfPresent(neuroMLfiles, line,
								request.getParameter("url"));
					}

				} else if (url.getProtocol().equals("file")) {
					File f = new File(url.getPath());
					
					if (f != null && f.isDirectory()) {
						
						List<File> files=Arrays.asList(f.listFiles(new FilenameFilter() {
							public boolean accept(File dir, String filename) {
								return filename.endsWith(".nml");
							}
						}));
						for(File file:files)
						{
							neuroMLfiles.add(new URL("file://"+file.getAbsolutePath()));
						}
					}
				}
			}

			NeuroMLConverter neuromlConverter = new NeuroMLConverter();
			List<Neuroml> neuromls = new ArrayList<Neuroml>();
			for (URL neuroMLFile : neuroMLfiles) {
				neuromls.add(neuromlConverter.urlToNeuroML(neuroMLFile));

			}
			MorphologyConverter morphologyConverter = new MorphologyConverter();
			Scene scene = morphologyConverter.getSceneFromNeuroML(neuromls);
			ObjectMapper mapper = new ObjectMapper();

			response.setCharacterEncoding("UTF-8");
			response.setContentType("application/json");
			mapper.writeValue(response.getOutputStream(), scene);

		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	private void addURLIfPresent(List<URL> neuroMLfiles, String line,
			String folderURL) {
		String pattern = ".nml?rev";
		if (line.contains(pattern)) {
			int startURLIndex = line.indexOf("\"");
			int endURLIndex = line.indexOf("\"", startURLIndex + 1);
			String path = line.substring(startURLIndex, endURLIndex);
			String fileName = path.substring(path.lastIndexOf("/") + 1,
					path.length());
			fileName = fileName.substring(0, fileName.indexOf("?"));
			try {
				neuroMLfiles.add(new URL(folderURL + fileName));
			} catch (MalformedURLException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}

	}

}
