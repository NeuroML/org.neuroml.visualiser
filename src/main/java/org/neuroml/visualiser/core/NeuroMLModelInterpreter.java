/**
 * 
 */
package org.neuroml.visualiser.core;

import java.io.IOException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.xml.bind.JAXBElement;
import javax.xml.bind.UnmarshalException;

import org.geppetto.core.visualisation.model.AGeometry;
import org.geppetto.core.visualisation.model.Cylinder;
import org.geppetto.core.visualisation.model.Entity;
import org.geppetto.core.visualisation.model.Metadata;
import org.geppetto.core.visualisation.model.Point;
import org.geppetto.core.visualisation.model.Reference;
import org.geppetto.core.visualisation.model.Scene;
import org.geppetto.core.visualisation.model.Sphere;
import org.neuroml.model.Cell;
import org.neuroml.model.ChannelDensity;
import org.neuroml.model.Include;
import org.neuroml.model.Instance;
import org.neuroml.model.Location;
import org.neuroml.model.Member;
import org.neuroml.model.Morphology;
import org.neuroml.model.Network;
import org.neuroml.model.NeuroMLDocument;
import org.neuroml.model.Point3DWithDiam;
import org.neuroml.model.Population;
import org.neuroml.model.PopulationTypes;
import org.neuroml.model.Segment;
import org.neuroml.model.SegmentGroup;
import org.neuroml.model.SynapticConnection;
import org.neuroml.model.ValueAcrossSegOrSegGroup;
import org.neuroml.model.util.NeuroMLConverter;

/**
 * @author matteocantarelli
 * 
 */
public class NeuroMLModelInterpreter
{

	private NeuroMLConverter _neuromlConverter = null;
	private static final String GROUP_PROPERTY = "group";

	// neuroml hardcoded concepts
	private static final String DENDRITE_GROUP = "dendrite_group";
	private static final String AXON_GROUP = "axon_group";
	private static final String SOMA_GROUP = "soma_group";

	/**
	 * 
	 */
	public NeuroMLModelInterpreter()
	{
		super();
		try
		{
			_neuromlConverter = new NeuroMLConverter();
		}
		catch(Exception e)
		{
			e.printStackTrace();
		}
	}

	/**
	 * @param neuromls
	 * @return
	 */
	public Scene getSceneFromNeuroML(List<URL> neuromlURLs)
	{
		Scene scene = new Scene();
		for(URL url : neuromlURLs)
		{
			NeuroMLDocument neuroml;
			try
			{
				neuroml = _neuromlConverter.urlToNeuroML(url);
				scene.getEntities().addAll(getEntitiesFromMorphologies(neuroml)); // if there's any morphology
				scene.getEntities().addAll(getEntitiesFromNetwork(neuroml, url)); // if a population is described -> network
			}
			catch(Exception e)
			{
				e.printStackTrace();
			}
		}
		return scene;
	}

	/**
	 * @param neuroml
	 * @return
	 */
	public List<Entity> getEntitiesFromMorphologies(NeuroMLDocument neuroml)
	{
		List<Entity> entities = new ArrayList<Entity>();
		List<Morphology> morphologies = neuroml.getMorphology();
		if(morphologies != null)
		{
			for(Morphology m : morphologies)
			{
				Entity entity = getEntityFromMorphology(m);
				entities.add(entity);
			}
		}
		List<Cell> cells = neuroml.getCell();
		if(cells != null)
		{
			for(Cell c : cells)
			{
				Morphology cellmorphology = c.getMorphology();
				if(cellmorphology != null)
				{
					Entity cell = new Entity();
					cell.setSubentities(getEntitiesFromMorphologyBySegmentGroup(cellmorphology, c.getId()));
					cell.setId(c.getId());
					augmentWithMetaData(cell, c);
					entities.add(cell);
				}
			}
		}
		return entities;
	}

	private static final int MAX_ATTEMPTS = 3;

	/**
	 * @param neuroml
	 * @param scene
	 * @param url
	 * @throws Exception
	 */
	private Collection<Entity> getEntitiesFromNetwork(NeuroMLDocument neuroml, URL url) throws Exception
	{
		Map<String, Entity> entities = new HashMap<String, Entity>();
		String baseURL = url.getFile();
		if(url.getFile().endsWith("nml"))
		{
			baseURL = baseURL.substring(0, baseURL.lastIndexOf("/") + 1);
		}
		List<Network> networks = neuroml.getNetwork();
		for(Network n : networks)
		{
			for(Population p : n.getPopulation())
			{
				boolean attemptConnection = true;
				int attempts = 0;
				NeuroMLDocument neuromlComponent = null;
				String component = p.getComponent();
				URL componentURL = new URL(url.getProtocol() + "://" + url.getAuthority() + baseURL + component + ".nml");
				while(attemptConnection)
				{
					try
					{
						attemptConnection = false;
						attempts++;

						neuromlComponent = _neuromlConverter.urlToNeuroML(componentURL);
					}
					catch(UnmarshalException e)
					{
						if(e.getLinkedException() instanceof IOException)
						{
							if(attempts < MAX_ATTEMPTS)
							{
								attemptConnection = true;
							}
						}
					}
					catch(Exception e)
					{
						throw e;
					}
				}
				if(neuromlComponent == null)
				{
					continue;
				}
				if(p.getType() != null && p.getType().equals(PopulationTypes.POPULATION_LIST))
				{
					int i = 0;
					for(Instance instance : p.getInstance())
					{
						List<Entity> localEntities = getEntitiesFromMorphologies(neuromlComponent);
						for(Entity e : localEntities)
						{
							if(instance.getLocation() != null)
							{
								e.setPosition(getPoint(instance.getLocation()));
							}
							e.setId(e.getId() + "[" + i + "]");
							entities.put(e.getId(), e);
						}
						i++;
					}
				}
				else
				{
					int size = p.getSize().intValue();

					for(int i = 0; i < size; i++)
					{
						// FIXME the position of the population within the network needs to be specified in neuroml
						List<Entity> localEntities = getEntitiesFromMorphologies(neuromlComponent);
						for(Entity e : localEntities)
						{
							e.setId(e.getId() + "[" + i + "]");
							entities.put(e.getId(), e);
						}
					}
				}

				// FIXME what's the purpose of the id here?
				String id = p.getId();

			}
			for(SynapticConnection c : n.getSynapticConnection())
			{
				String from = c.getFrom();
				String to = c.getTo();

				Metadata mPost = new Metadata();
				mPost.setAdditionalProperties(Resources.SYNAPSE.get(), c.getSynapse());
				mPost.setAdditionalProperties(Resources.CONNECTION_TYPE.get(), Resources.POST_SYNAPTIC.get());
				Reference rPost = new Reference();
				rPost.setEntityId(to);
				rPost.setMetadata(mPost);

				Metadata mPre = new Metadata();
				mPre.setAdditionalProperties(Resources.SYNAPSE.get(), c.getSynapse());
				mPre.setAdditionalProperties(Resources.CONNECTION_TYPE.get(), Resources.PRE_SYNAPTIC.get());
				Reference rPre = new Reference();
				rPre.setEntityId(from);
				rPre.setMetadata(mPre);

				if(entities.containsKey(from))
				{
					entities.get(from).getReferences().add(rPost);
				}
				else
				{
					throw new Exception("Reference not found." + from + " was not found in the path of the network file");
				}

				if(entities.containsKey(to))
				{
					entities.get(to).getReferences().add(rPre);
				}
				else
				{
					throw new Exception("Reference not found." + to + " was not found in the path of the network file");
				}
			}
		}
		return entities.values();
	}

	/**
	 * @param entity
	 * @param c
	 */
	private void augmentWithMetaData(Entity entity, Cell c)
	{
		try
		{
			if(c.getBiophysicalProperties() != null)
			{
				Metadata membraneProperties = new Metadata();
				if(c.getBiophysicalProperties().getMembraneProperties() != null)
				{
					List<JAXBElement<?>> membranePropertiesPart = c.getBiophysicalProperties().getMembraneProperties().getChannelPopulationOrChannelDensityOrChannelDensityNernst();
					if(membranePropertiesPart != null)
					{
						Metadata channels = new Metadata();
						for(JAXBElement<?> e : membranePropertiesPart)
						{
							if(e.getName().getLocalPart().equals("channelDensity"))
							{
								String ionChannel = ((ChannelDensity) e.getValue()).getIonChannel();
								if(!channels.getAdditionalProperties().containsKey(ionChannel))
								{
									Metadata channelClass=new Metadata();
									channels.setAdditionalProperties(ionChannel, channelClass);
									channelClass.setAdditionalProperties("Highlight channel density", ionChannel);
								}
								Metadata specificChannel = new Metadata();
								((Metadata) channels.getAdditionalProperties().get(ionChannel)).setAdditionalProperties(((ChannelDensity) e.getValue()).getId(), specificChannel);
								specificChannel.setAdditionalProperties("Highlight", ((ChannelDensity) e.getValue()).getSegmentGroup());
								specificChannel.setAdditionalProperties("Location", ((ChannelDensity) e.getValue()).getSegmentGroup());
								specificChannel.setAdditionalProperties("Reverse potential", ((ChannelDensity) e.getValue()).getErev());
								specificChannel.setAdditionalProperties(Resources.COND_DENSITY.get(), ((ChannelDensity) e.getValue()).getCondDensity());
							}
							else if(e.getName().getLocalPart().equals("specificCapacitance"))
							{
								membraneProperties.setAdditionalProperties(Resources.SPECIFIC_CAPACITANCE.get(), ((ValueAcrossSegOrSegGroup) e.getValue()).getValue());
							}
						}
						membraneProperties.setAdditionalProperties("Ion Channels", channels);
					}
				}

				Metadata intracellularProperties = new Metadata();
				if(c.getBiophysicalProperties().getIntracellularProperties() != null)
				{
					if(c.getBiophysicalProperties().getIntracellularProperties().getResistivity() != null && c.getBiophysicalProperties().getIntracellularProperties().getResistivity().size() > 0)
					{
						intracellularProperties.setAdditionalProperties(Resources.RESISTIVITY.get(), c.getBiophysicalProperties().getIntracellularProperties().getResistivity().get(0).getValue());
					}
				}

				// Sample code to add URL metadata
				// Metadata externalResources = new Metadata();
				// externalResources.setAdditionalProperties("Worm Atlas", "URL:http://www.wormatlas.org/neurons/Individual%20Neurons/PVDmainframe.htm");
				// externalResources.setAdditionalProperties("WormBase", "URL:https://www.wormbase.org/tools/tree/run?name=PVDR;class=Cell");

				entity.setMetadata(new Metadata());
				entity.getMetadata().setAdditionalProperties(Resources.MEMBRANE_P.get(), membraneProperties);
				entity.getMetadata().setAdditionalProperties(Resources.INTRACELLULAR_P.get(), intracellularProperties);
				// entity.getMetadata().setAdditionalProperties("External Resources", externalResources);
			}
		}
		catch(NullPointerException ex)
		{

		}
	}

	/**
	 * @param morphology
	 * @return
	 */
	private Entity getEntityFromMorphology(Morphology morphology)
	{
		return getEntityFromListOfSegments(morphology.getSegment());
	}

	/**
	 * @param morphology
	 * @param cellId
	 * @return
	 */
	private List<Entity> getEntitiesFromMorphologyBySegmentGroup(Morphology morphology, String cellId)
	{
		Entity allSegments = getEntityFromListOfSegments(morphology.getSegment());
		List<Entity> entities = new ArrayList<Entity>();
		Map<String, List<AGeometry>> segmentGeometries = new HashMap<String, List<AGeometry>>();
		SegmentGroup somaGroup = null;
		SegmentGroup axonGroup = null;
		SegmentGroup dendriteGroup = null;

		if(morphology.getSegmentGroup().isEmpty())
		{
			// there are no segment groups
			entities.add(allSegments);
		}
		else
		{
			Map<String, List<String>> subgroupsMap = new HashMap<String, List<String>>();
			for(SegmentGroup sg : morphology.getSegmentGroup())
			{
				// three hardcoded groups :(
				if(sg.getId().equals(SOMA_GROUP))
				{
					somaGroup = sg;
				}
				else if(sg.getId().equals(AXON_GROUP))
				{
					axonGroup = sg;
				}
				else if(sg.getId().equals(DENDRITE_GROUP))
				{
					dendriteGroup = sg;
				}

				for(Include include : sg.getInclude())
				{
					// the map is <containedGroup,containerGroup>
					if(!subgroupsMap.containsKey(include.getSegmentGroup()))
					{
						subgroupsMap.put(include.getSegmentGroup(), new ArrayList<String>());
					}
					subgroupsMap.get(include.getSegmentGroup()).add(sg.getId());
				}
				if(!sg.getMember().isEmpty())
				{
					segmentGeometries.put(sg.getId(), getGeometriesForGroup(sg, allSegments));
				}
			}
			for(String sg : segmentGeometries.keySet())
			{
				for(AGeometry g : segmentGeometries.get(sg))
				{
					g.setAdditionalProperties("segment_groups", getAllGroupsString(sg, subgroupsMap, ""));
				}
			}

//			if(somaGroup != null)
//			{
//				Entity entity = createEntityForMacroGroup(somaGroup, segmentGeometries, allSegments.getGeometries());
//				entity.setId(getGroupId(cellId, somaGroup.getId()));
//				entities.add(entity);
//			}
//			if(axonGroup != null)
//			{
//				Entity entity = createEntityForMacroGroup(axonGroup, segmentGeometries, allSegments.getGeometries());
//				entity.setId(getGroupId(cellId, axonGroup.getId()));
//				entities.add(entity);
//			}
//			if(dendriteGroup != null)
//			{
//				Entity entity = createEntityForMacroGroup(dendriteGroup, segmentGeometries, allSegments.getGeometries());
//				entity.setId(getGroupId(cellId, dendriteGroup.getId()));
//				entities.add(entity);
//			}

			// this adds all segment groups not contained in the macro groups if any
			for(String sgId : segmentGeometries.keySet())
			{
				Entity entity = new Entity();
				entity.getGeometries().addAll(segmentGeometries.get(sgId));
				entity.setAdditionalProperties(GROUP_PROPERTY, sgId);
				entity.setId(getGroupId(cellId, sgId));
				entities.add(entity);
			}
		}
		return entities;
	}

	/**
	 * @param targetSg
	 * @param subgroupsMap
	 * @param allGroupsStringp
	 * @return a semicolon separated string containing all the subgroups that contain a given subgroup
	 */
	private String getAllGroupsString(String targetSg, Map<String, List<String>> subgroupsMap, String allGroupsStringp)
	{
		if(subgroupsMap.containsKey(targetSg))
		{
			StringBuilder allGroupsString=new StringBuilder(allGroupsStringp);
			for(String containerGroup:subgroupsMap.get(targetSg))
			{
				allGroupsString.append(containerGroup+"; ");
				allGroupsString.append(getAllGroupsString(containerGroup, subgroupsMap, ""));
			}
			return allGroupsString.toString();
		}
		return allGroupsStringp.trim();
	}

	/**
	 * @param cellId
	 * @param segmentGroupId
	 * @return
	 */
	private String getGroupId(String cellId, String segmentGroupId)
	{
		return cellId + " " + segmentGroupId;
	}

	/**
	 * @param somaGroup
	 * @param segmentGeometries
	 */
	private Entity createEntityForMacroGroup(SegmentGroup macroGroup, Map<String, List<AGeometry>> segmentGeometries, List<AGeometry> allSegments)
	{
		Entity entity = new Entity();
		entity.setAdditionalProperties(GROUP_PROPERTY, macroGroup.getId());
		for(Include i : macroGroup.getInclude())
		{
			if(segmentGeometries.containsKey(i.getSegmentGroup()))
			{
				entity.getGeometries().addAll(segmentGeometries.get(i.getSegmentGroup()));
				segmentGeometries.remove(i.getSegmentGroup());
			}
		}
		for(Member m : macroGroup.getMember())
		{
			for(AGeometry g : allSegments)
			{
				if(g.getId().equals(m.getSegment().toString()))
				{
					entity.getGeometries().add(g);
					allSegments.remove(g);
					break;
				}
			}
		}
		segmentGeometries.remove(macroGroup.getId());
		return entity;
	}

	/**
	 * @param sg
	 * @param allSegments
	 * @return
	 */
	private List<AGeometry> getGeometriesForGroup(SegmentGroup sg, Entity allSegments)
	{
		List<AGeometry> geometries = new ArrayList<AGeometry>();
		for(Member m : sg.getMember())
		{
			for(AGeometry g : allSegments.getGeometries())
			{
				if(g.getId().equals(m.getSegment().toString()))
				{
					geometries.add(g);
				}
			}
		}
		return geometries;
	}

	/**
	 * @param list
	 * @return
	 */
	private Entity getEntityFromListOfSegments(List<Segment> list)
	{
		Entity entity = new Entity();
		Map<String, Point3DWithDiam> distalPoints = new HashMap<String, Point3DWithDiam>();
		for(Segment s : list)
		{
			String idSegmentParent = null;
			Point3DWithDiam parentDistal = null;
			if(s.getParent() != null)
			{
				idSegmentParent = s.getParent().getSegment().toString();
			}
			if(distalPoints.containsKey(idSegmentParent))
			{
				parentDistal = distalPoints.get(idSegmentParent);
			}
			entity.getGeometries().add(getCylinderFromSegment(s, parentDistal));
			distalPoints.put(s.getId().toString(), s.getDistal());
		}
		return entity;
	}

	/**
	 * @param p1
	 * @param p2
	 * @return
	 */
	private boolean samePoint(Point3DWithDiam p1, Point3DWithDiam p2)
	{
		return p1.getX() == p2.getX() && p1.getY() == p2.getY() && p1.getZ() == p2.getZ() && p1.getDiameter() == p2.getDiameter();
	}

	/**
	 * @param s
	 * @param parentDistal
	 * @return
	 */
	private AGeometry getCylinderFromSegment(Segment s, Point3DWithDiam parentDistal)
	{

		Point3DWithDiam proximal = s.getProximal() == null ? parentDistal : s.getProximal();
		Point3DWithDiam distal = s.getDistal();

		if(samePoint(proximal, distal)) // ideally an equals but the objects
										// are generated. hassle postponed.
		{
			Sphere sphere = new Sphere();
			sphere.setRadius(proximal.getDiameter() / 2);
			sphere.setPosition(getPoint(proximal));
			sphere.setId(s.getId().toString());
			return sphere;
		}
		else
		{
			Cylinder cyl = new Cylinder();
			cyl.setId(s.getId().toString());
			if(proximal != null)
			{
				cyl.setPosition(getPoint(proximal));
				cyl.setRadiusBottom(proximal.getDiameter() / 2);
			}

			if(distal != null)
			{
				cyl.setRadiusTop(s.getDistal().getDiameter() / 2);
				cyl.setDistal(getPoint(distal));
				cyl.setHeight(0d);
			}
			return cyl;
		}

	}

	/**
	 * @param distal
	 * @return
	 */
	private Point getPoint(Point3DWithDiam distal)
	{
		Point point = new Point();
		point.setX(distal.getX());
		point.setY(distal.getY());
		point.setZ(distal.getZ());
		return point;
	}

	/**
	 * @param location
	 * @return
	 */
	private Point getPoint(Location location)
	{
		Point point = new Point();
		point.setX(location.getX().doubleValue());
		point.setY(location.getY().doubleValue());
		point.setZ(location.getZ().doubleValue());
		return point;
	}

}
