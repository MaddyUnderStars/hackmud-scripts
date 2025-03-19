import { table } from "/lib/table";

export default (context: Context, args: unknown) => {
    $fs.maddy.analytics({ context, args });

    const header = `                  :                                                                       
       %#%@*%=%@%=*++-*%%  %@. %*  #%+                                                    
      %:%% %%% .*@%%@%=. -@- %%   %=        +%                                            
     .%%%+%@ #%%=--   *%%*  @- =%=   %% #@.    -  #*                    ..                
     %%+@%.#%@ +%@%%%@%+  %#  #+.*@*+*- .    -      .  %                #%#               
    %%@%-%%#+*%%@%@=                              %%+      %            +%.@              
    %%@@@%#                                              -%-  *         *% @%        @@%  
                                                               % #      %## %@   .%@%-%   
                                                                       -% % :@@%# %- %    
                                                                       %% -=.#: @. %%     
    ███╗   ███╗ █████╗ ██████╗ ██████╗ ██╗   ██╗    .#%%% % == %   . # @      
    ████╗ ████║██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝         % +%.% @ - @ =  *    .. *%       
    ██╔████╔██║███████║██║  ██║██║  ██║ ╚████╔╝             *%% % @  - .  .  * =  :=      
    ██║╚██╔╝██║██╔══██║██║  ██║██║  ██║  ╚██╔╝                   %@  #  *  : :     :*     
    ██║ ╚═╝ ██║██║  ██║██████╔╝██████╔╝   ██║                        @@             -@    
    ╚═╝     ╚═╝╚═╝  ╚═╝╚═════╝ ╚═════╝    ╚═╝                        @                %   
                  understars                                         #    %   %%.      =  
                                                                    %   %          @#     
                                                                   - -%                 @ 
                                                                   .                      
`;

    // biome-ignore lint/style/useTemplate: <explanation>
    return `${header}\n` +
        "All scripts listed here are `2free of charge` and do not contain any malicious payloads.\n" +
        "`DThe same cannot be said for scripts not listed here.`\n\n" +
        `${table([
            ["SEC", "script", "desc"],
            [],
            ["`2FS`", "maddy.read", "Decorrupt script output"],
            ["`2FS`", "maddy.t1", "T1 cracker"],
            ["`2FS`", "maddy.search_t1", "Really bad t1 corp loc search"],
            ["`2FS`", "maddy.search_t2", "Actually not bad t2 corp loc search"],
            ["`2FS`", "maddy.market", "Market listings viewer"],
            ["`2FS`", "maddy.analytics", "Script analytics collection and viewer"],
            [],
            ["`HMS`", "maddy.scripts", "Public scripts viewer. MS due to chats join/leave"],
            ["`HMS`", "maddy.corps", "Search for corp scripts. MS due to maddy.scripts usage"],
            [],
            ["`FLS`", "maddy.log", "sys.access_log viewer. Shows all unread logs made by users"],
        ], context.cols)
        }`;
};