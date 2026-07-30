`timescale 1ns / 1ps

module hazard_detection_unit(

    input logic MemRead_EX,
    input logic [4:0] rd_EX,
    input logic [4:0] rs1_ID,
    input logic [4:0] rs2_ID,

    output logic stall

);

always_comb begin

    if (MemRead_EX &&
       ((rd_EX == rs1_ID) || (rd_EX == rs2_ID)) &&
        (rd_EX != 5'd0))
        stall = 1'b1;
    else
        stall = 1'b0;

end

endmodule