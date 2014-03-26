package org.neuroml.visualiser.core;

/**
 * Class to hold resources used in the visualiser. This elements will be displayed to the user.
 * @author matteocantarelli
 *
 */
public enum Resources
{
	COND_DENSITY("Conductance density"),
	SPIKE_THRESHOLD("Spike threshold"),
	REVERSAL_POTENTIAL("Reversal potential"),
	SPECIFIC_CAPACITANCE("Specific capacitance"),
	INIT_MEMBRANE_POTENTIAL("Initial membrane potential"),
	RESISTIVITY("Resistivity"),
	MEMBRANE_P("Membrane properties"),
	INTRACELLULAR_P("Intracellular properties"), 
	SYNAPSE("Synapse Type"), 
	CONNECTION_TYPE("Connection type"),
	PRE_SYNAPTIC("Input"),
	POST_SYNAPTIC("Output"), 
	HIGHLIGHT("Highlight"), 
	LOCATION("Location"), 
	ION_CHANNELS("Ion channels"), 
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
