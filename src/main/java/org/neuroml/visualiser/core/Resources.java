package org.neuroml.visualiser.core;

/**
 * Class to hold resources used in the visualiser. This elements will be displayed to the user.
 * @author matteocantarelli
 *
 */
public enum Resources
{
	COND_DENSITY("Conductance density"),
	SPIKE_THRESHOLD("Spike Threshold"),
	REVERSAL_POTENTIAL("Reversal Potential"),
	SPECIFIC_CAPACITANCE("Specific Capacitance"),
	INIT_MEMBRANE_POTENTIAL("Initial Membrane Potential"),
	RESISTIVITY("Resistivity"),
	MEMBRANE_P("Membrane Properties"),
	INTRACELLULAR_P("Intracellular Properties"), 
	SYNAPSE("Synapse Type"), 
	CONNECTION_TYPE("Connection Type"),
	PRE_SYNAPTIC("Input"),
	POST_SYNAPTIC("Output"), 
	HIGHLIGHT("Highlight"), 
	LOCATION("Location"), 
	ION_CHANNELS("Ion Channels"), 
	HIGHLIGHT_CHAN_DENSITY("Highlight channel density");
	private String _value;
	
	private Resources(String value)
	{
		_value=value;
	}
	
	public String get()
	{
		return _value;
	}
}
