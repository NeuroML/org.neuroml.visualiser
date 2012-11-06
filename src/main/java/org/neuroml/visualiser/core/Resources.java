package org.neuroml.visualiser.core;

/**
 * Class to hold resources used in the visualiser. This elements will be displayed to the user.
 * @author matteocantarelli
 *
 */
public enum Resources
{
	COND_DENSITY("Condunctance density"),
	SPIKE_THRESHOLD("Spike Threshold"),
	SPECIFIC_CAPACITANCE("Specific Capacitance"),
	INIT_MEMBRANE_POTENTIAL("Initial Membrane Potential"),
	RESISTIVITY("Resistivity"),
	MEMBRANE_P("Membrane Properties"),
	INTRACELLULAR_P("Intracellular Properties");
	
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
