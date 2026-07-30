`timescale 1ns / 1ps

module forwarding_unit(

    input  logic RegWrite_MEM,
    input  logic RegWrite_WB,

    input  logic [4:0] rd_MEM,
    input  logic [4:0] rd_WB,

    input  logic [4:0] rs1_EX,
    input  logic [4:0] rs2_EX,

    output logic [1:0] ForwardA,
    output logic [1:0] ForwardB

);

always_comb begin

    ForwardA = 2'b00;
    ForwardB = 2'b00;

    // EX source A
    if(RegWrite_MEM && (rd_MEM != 0) && (rd_MEM == rs1_EX))
        ForwardA = 2'b10;
    else if(RegWrite_WB && (rd_WB != 0) && (rd_WB == rs1_EX))
        ForwardA = 2'b01;

    // EX source B
    if(RegWrite_MEM && (rd_MEM != 0) && (rd_MEM == rs2_EX))
        ForwardB = 2'b10;
    else if(RegWrite_WB && (rd_WB != 0) && (rd_WB == rs2_EX))
        ForwardB = 2'b01;

end

endmodule