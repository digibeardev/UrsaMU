/*
===============================================================================
==== Room Format ==============================================================

These are a few example settings taken from KumaMU, a MUSH derivative. 

*/

@nameformat here = [header(%0)]

@conformat here =
  [cat(
    lheader( Characters ), %r,
    ljust( %ch%cuName%cn, 25 ),
    ljust( %ch%cuIdle%cn, 16 ),
    %ch%cuShort-Desc%cn,
    if(
      lcon( here,player ),
      iter( %0,
        cat(
          %r,
          ljust( name( ## ), 25 ),
          ljust( idle( ## ), 16 ),
          default( 
            ##, 
            short-desc,
            %ch%cxType%cn &short-desc me=<desc> %ch%cxto set.%cn
          ) 
        )
      ) 
    )
  )]
  

@exitformat here =
  [if(
    lexits( me ),
    cat(%r,
      lheader(Exits),%r,
      columns(
        iter(lexits(me),name(##),,|),3,,|
      ),%r,
      footer(
        ifelse(
          hasflag(me,IC),
          IC,
          OOC
        )
      )
    )
  )]
