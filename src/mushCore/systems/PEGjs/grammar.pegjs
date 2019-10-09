expression = "["_ f: function _ "]" {return f} / 
			 function 
 
function =  _ call: word "(" _  a: (args)? _ ")" _  
{ 
	return {type: "function", operator: call, args:  [a].flat() }
}
args = a: arg "/" t: expression {return [a,t].flat() } / 
	   a: (expression/arg) _ "," _ t: (expression/args)  {return t ? [a,t].flat() : a} / 
	   (expression/arg) 


arg = w: word { return {type: "word", value: w} }

// Since we'll be handling numbers with javascript, for now all we
// need is a word NT.
word = w:[a-zA-Z0-9#%]+ {return w.join("")} 

// Define white space.
_ = [ \t\n\r]*
